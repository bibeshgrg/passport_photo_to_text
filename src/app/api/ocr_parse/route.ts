
import { NextResponse } from 'next/server';
import sharp from 'sharp';

export async function POST(request: Request) {
  // Get the form data from the request
  const formData = await request.formData();

  // Get the image file from form data
  const imageFile = formData.get('image') as Blob;

  // Check if the file is valid
  if (!imageFile || !(imageFile instanceof Blob)) {
    return NextResponse.json({ error: 'Invalid image file' }, { status: 400 });
  }

  try {
    // Convert the image file to a Buffer
    const buffer = Buffer.from(await imageFile.arrayBuffer());

    // Preprocess the image using sharp
    const processedImageBuffer = await sharp(buffer)
      .grayscale() // Convert to grayscale
      .normalize() // Enhance contrast
      .toBuffer();

    // Create a new FormData instance to send to OCR.space
    const ocrFormData = new FormData();
    ocrFormData.append('file', new Blob([processedImageBuffer]), 'image.png');
    ocrFormData.append('apikey', process.env.OCR_SPACE_KEY!);

    // Send the image to OCR.space API
    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: ocrFormData,
    });

    // Parse the response from OCR.space
    const data = await response.json();

    // Check for errors in the OCR.space response
    if (data.IsErroredOnProcessing) {
      return NextResponse.json({ error: data.ErrorMessage }, { status: 400 });
    }

    // Return the parsed data
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error processing the image:', error);
    return NextResponse.json({ error: 'Error processing the image' }, { status: 500 });
  }
}
