"""
OLLI AI Inpainting Server
=========================
Self-hosted AI inpainting backend using Stable Diffusion Inpainting.
Built with FastAPI + diffusers (Hugging Face) for local GPU inference.

Usage:
  pip install -r requirements.txt
  python main.py

Environment variables:
  MODEL_ID    - HuggingFace model ID (default: runwayml/stable-diffusion-inpainting)
  DEVICE      - torch device (default: auto-detect cuda/mps/cpu)
  HOST        - server host (default: 0.0.0.0)
  PORT        - server port (default: 8100)
  CORS_ORIGIN - allowed CORS origin (default: *)
"""

import io
import os
import base64
import logging
from typing import Optional

import uvicorn
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from PIL import Image

# ─── Logging ────────────────────────────────────────────────────────────────

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("inpainting")

# ─── Config ─────────────────────────────────────────────────────────────────

MODEL_ID = os.getenv("MODEL_ID", "runwayml/stable-diffusion-inpainting")
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8100"))
CORS_ORIGIN = os.getenv("CORS_ORIGIN", "*")

# ─── Device detection ───────────────────────────────────────────────────────

def detect_device() -> str:
    """Auto-detect the best available torch device."""
    import torch

    env_device = os.getenv("DEVICE")
    if env_device:
        return env_device
    if torch.cuda.is_available():
        return "cuda"
    if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        return "mps"
    return "cpu"

# ─── Model loading ──────────────────────────────────────────────────────────

_pipeline = None


def get_pipeline():
    """Lazy-load the Stable Diffusion Inpainting pipeline."""
    global _pipeline
    if _pipeline is not None:
        return _pipeline

    import torch
    from diffusers import StableDiffusionInpaintPipeline

    device = detect_device()
    dtype = torch.float16 if device == "cuda" else torch.float32

    logger.info(f"Loading model '{MODEL_ID}' on device '{device}' (dtype={dtype})...")

    _pipeline = StableDiffusionInpaintPipeline.from_pretrained(
        MODEL_ID,
        torch_dtype=dtype,
        safety_checker=None,         # Disable NSFW filter for speed
        requires_safety_checker=False,
    ).to(device)

    # Optimizations
    if device == "cuda":
        try:
            _pipeline.enable_xformers_memory_efficient_attention()
            logger.info("xformers memory efficient attention enabled")
        except Exception:
            logger.info("xformers not available, using default attention")

    logger.info("Model loaded successfully!")
    return _pipeline

# ─── Image helpers ──────────────────────────────────────────────────────────

def decode_base64_image(data: str) -> Image.Image:
    """Decode a base64-encoded image string to PIL Image."""
    # Strip data URI prefix if present
    if "," in data:
        data = data.split(",", 1)[1]
    img_bytes = base64.b64decode(data)
    return Image.open(io.BytesIO(img_bytes)).convert("RGB")


def decode_base64_mask(data: str) -> Image.Image:
    """Decode a base64-encoded mask image to PIL Image (grayscale)."""
    if "," in data:
        data = data.split(",", 1)[1]
    img_bytes = base64.b64decode(data)
    return Image.open(io.BytesIO(img_bytes)).convert("L")


def pil_to_base64(img: Image.Image, fmt: str = "PNG") -> str:
    """Convert PIL Image to base64 string with data URI prefix."""
    buf = io.BytesIO()
    img.save(buf, format=fmt)
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    mime = "image/png" if fmt.upper() == "PNG" else "image/jpeg"
    return f"data:{mime};base64,{b64}"


def resize_for_sd(img: Image.Image, target: int = 512) -> Image.Image:
    """Resize image so both dimensions are multiples of 8, fitting within target."""
    w, h = img.size
    ratio = min(target / w, target / h)
    nw = int(w * ratio) // 8 * 8
    nh = int(h * ratio) // 8 * 8
    return img.resize((nw, nh), Image.LANCZOS)

# ─── FastAPI app ────────────────────────────────────────────────────────────

app = FastAPI(
    title="OLLI AI Inpainting Server",
    description="Self-hosted Stable Diffusion inpainting for the OLLI drawing tool",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[CORS_ORIGIN] if CORS_ORIGIN != "*" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Request / Response models ──────────────────────────────────────────────

class InpaintRequest(BaseModel):
    """JSON-based inpainting request with base64 images."""
    image: str             # base64 encoded original image
    mask: str              # base64 encoded mask (white = area to inpaint)
    prompt: str = ""       # text prompt for inpainting
    negative_prompt: str = "blurry, low quality, watermark, text"
    num_inference_steps: int = 30
    guidance_scale: float = 7.5
    strength: float = 0.8  # 0.0-1.0, higher = more change
    seed: Optional[int] = None


class InpaintResponse(BaseModel):
    """Response with base64 encoded result image."""
    result: str            # base64 encoded result image
    width: int
    height: int

# ─── Endpoints ──────────────────────────────────────────────────────────────

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "model": MODEL_ID}


@app.post("/inpaint", response_model=InpaintResponse)
async def inpaint_json(req: InpaintRequest):
    """
    Perform AI inpainting using base64-encoded images.

    - **image**: Original image as base64 data URI or raw base64
    - **mask**: Mask image (white = areas to erase/inpaint)
    - **prompt**: Description of what to fill in
    - **negative_prompt**: Things to avoid
    - **num_inference_steps**: Denoising steps (10-50, default 30)
    - **guidance_scale**: Prompt adherence (1-20, default 7.5)
    - **strength**: How much to change (0.0-1.0, default 0.8)
    - **seed**: Random seed for reproducibility
    """
    import torch

    try:
        pipe = get_pipeline()
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        raise HTTPException(status_code=503, detail=f"Model not available: {str(e)}")

    try:
        # Decode images
        original = decode_base64_image(req.image)
        mask = decode_base64_mask(req.mask)

        # Store original dimensions
        orig_w, orig_h = original.size

        # Resize for Stable Diffusion (needs multiples of 8)
        original_resized = resize_for_sd(original)
        mask_resized = mask.resize(original_resized.size, Image.LANCZOS)

        # Ensure mask is binary (threshold at 128)
        mask_resized = mask_resized.point(lambda p: 255 if p > 128 else 0)

        # Set seed
        generator = None
        if req.seed is not None:
            generator = torch.Generator(device=pipe.device).manual_seed(req.seed)

        # Run inpainting
        logger.info(
            f"Running inpainting: size={original_resized.size}, "
            f"steps={req.num_inference_steps}, strength={req.strength}"
        )

        result = pipe(
            prompt=req.prompt or "clean background, seamless fill",
            negative_prompt=req.negative_prompt,
            image=original_resized,
            mask_image=mask_resized,
            num_inference_steps=req.num_inference_steps,
            guidance_scale=req.guidance_scale,
            strength=req.strength,
            generator=generator,
        ).images[0]

        # Resize back to original dimensions
        result = result.resize((orig_w, orig_h), Image.LANCZOS)

        # Encode to base64
        result_b64 = pil_to_base64(result)

        return InpaintResponse(
            result=result_b64,
            width=orig_w,
            height=orig_h,
        )

    except Exception as e:
        logger.error(f"Inpainting failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Inpainting failed: {str(e)}")


@app.post("/inpaint/upload")
async def inpaint_upload(
    image: UploadFile = File(..., description="Original image file"),
    mask: UploadFile = File(..., description="Mask image file (white = inpaint area)"),
    prompt: str = Form(default="", description="Text prompt"),
    negative_prompt: str = Form(default="blurry, low quality, watermark, text"),
    num_inference_steps: int = Form(default=30),
    guidance_scale: float = Form(default=7.5),
    strength: float = Form(default=0.8),
    seed: Optional[int] = Form(default=None),
):
    """
    Perform AI inpainting using uploaded image files.
    Returns the result as a PNG image stream.
    """
    import torch

    try:
        pipe = get_pipeline()
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        raise HTTPException(status_code=503, detail=f"Model not available: {str(e)}")

    try:
        # Read uploaded files
        image_bytes = await image.read()
        mask_bytes = await mask.read()

        original = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        mask_img = Image.open(io.BytesIO(mask_bytes)).convert("L")

        orig_w, orig_h = original.size

        # Resize for SD
        original_resized = resize_for_sd(original)
        mask_resized = mask_img.resize(original_resized.size, Image.LANCZOS)
        mask_resized = mask_resized.point(lambda p: 255 if p > 128 else 0)

        # Set seed
        generator = None
        if seed is not None:
            generator = torch.Generator(device=pipe.device).manual_seed(seed)

        logger.info(
            f"Running inpainting (upload): size={original_resized.size}, "
            f"steps={num_inference_steps}, strength={strength}"
        )

        result = pipe(
            prompt=prompt or "clean background, seamless fill",
            negative_prompt=negative_prompt,
            image=original_resized,
            mask_image=mask_resized,
            num_inference_steps=num_inference_steps,
            guidance_scale=guidance_scale,
            strength=strength,
            generator=generator,
        ).images[0]

        # Resize back to original
        result = result.resize((orig_w, orig_h), Image.LANCZOS)

        # Return as streaming PNG
        buf = io.BytesIO()
        result.save(buf, format="PNG")
        buf.seek(0)

        return StreamingResponse(buf, media_type="image/png")

    except Exception as e:
        logger.error(f"Inpainting (upload) failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Inpainting failed: {str(e)}")


@app.get("/models")
async def list_models():
    """List the current model configuration."""
    return {
        "current_model": MODEL_ID,
        "available_models": [
            {
                "id": "runwayml/stable-diffusion-inpainting",
                "name": "Stable Diffusion Inpainting v1.5",
                "description": "Standard inpainting model, good quality/speed balance",
            },
            {
                "id": "stabilityai/stable-diffusion-2-inpainting",
                "name": "Stable Diffusion Inpainting v2",
                "description": "Improved quality, requires more VRAM",
            },
            {
                "id": "diffusers/stable-diffusion-xl-1.0-inpainting-0.1",
                "name": "Stable Diffusion XL Inpainting",
                "description": "Highest quality, requires significant VRAM (8GB+)",
            },
        ],
    }


# ─── Main ───────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    logger.info(f"Starting OLLI AI Inpainting Server on {HOST}:{PORT}")
    logger.info(f"Model: {MODEL_ID}")
    uvicorn.run(
        "main:app",
        host=HOST,
        port=PORT,
        reload=False,
        log_level="info",
    )
