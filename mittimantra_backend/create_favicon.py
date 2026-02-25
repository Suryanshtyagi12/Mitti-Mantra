
from PIL import Image, ImageDraw

def create_favicon():
    # Create a 32x32 image with a green background (Mittimantra theme)
    img = Image.new('RGB', (32, 32), color='#2E7D32')
    
    # Draw a simple "M" or leaf shape
    d = ImageDraw.Draw(img)
    d.text((10, 8), "M", fill="white")
    
    # Save as PNG
    img.save('static/favicon.png')
    print("Favicon created at static/favicon.png")

if __name__ == "__main__":
    create_favicon()
