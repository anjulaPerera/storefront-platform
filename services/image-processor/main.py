import logging
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from rembg import remove, new_session
import io
from PIL import Image

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("image-processor")

app = FastAPI(title="Storefront Background Removal Microservice")

# Allow calls from frontend/backend environments
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Shared session caching to prevent reloading weights on every execution thread
session = new_session("u2net")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "rembg-processor"}

@app.post("/remove-background")
async def remove_background(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Input must be an image.")

    try:
        logger.info(f"Processing background removal for file: {file.filename}")
        input_bytes = await file.read()
        
        # Process the image with rembg using the pre-cached session
        output_bytes = remove(input_bytes, session=session)
        
        # Verify the file is readable by PIL and convert to PNG buffer output
        img = Image.open(io.BytesIO(output_bytes))
        img_buffer = io.BytesIO()
        img.save(img_buffer, format="PNG")
        
        return Response(content=img_buffer.getvalue(), media_type="image/png")
        
    except Exception as e:
        logger.error(f"Error executing background removal: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Inference processing failed: {str(e)}")