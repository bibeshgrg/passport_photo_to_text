"use client"
import Tesseract from 'tesseract.js';
import { useState } from 'react';
import Image from 'next/image';
import { parse as parseMRZ } from 'mrz';

const ImageToText = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<Record<string, string | undefined> | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const sanitizeText = (text: string) => {
    // Split text into lines, remove invalid characters
    return text
      .split('\n')
      .map((line) => line.replace(/[^A-Z0-9<]/g, '')) // Keep only alphanumeric characters and '<'
      .filter((line) => line.length === 44 || line.length === 36); // Keep only lines of typical MRZ length
  };
  
  const extractMRZText = async () => {
    if (!imageFile) return;
  
    setLoading(true);
  
    try {
      const { data: { text } } = await Tesseract.recognize(imageFile, 'eng', {
        logger: (m) => console.log(m),
      });
  
      // Log the raw OCR text for debugging
      console.log("Raw OCR text:", text);
      
      const sanitizedLines = sanitizeText(text);
      if (sanitizedLines.length < 2) {
        console.error("Extracted text does not contain valid MRZ lines.");
        setParsedData(null);
        setLoading(false);
        return;
      }
  
      // Parse MRZ data
      const parsedMRZ = parseMRZ(sanitizedLines);
  
      // Create the full MRZ line
      const fullMRZLine = sanitizedLines.join(''); // Concatenate sanitized lines
  
      if (parsedMRZ.valid) {
        const sanitizedFields = Object.fromEntries(
          Object.entries(parsedMRZ.fields).map(([key, value]) => [key, value ?? undefined])
        ) as Record<string, string | undefined>;
  
        setParsedData({
          ...sanitizedFields,
          fullMRZLine, // Add the full MRZ line to the parsed data
        });
      } else {
        console.error("Invalid MRZ format");
        setParsedData(null);
      }
    } catch (error) {
      console.error('Error extracting text:', error);
      setParsedData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='px-10 py-10 flex flex-col space-y-10'>
    <div className='flex justify-center'>
      <span className='text-center'>Upload Your Passport Here</span>
    </div>
    <div>
      <label htmlFor="imageUpload" className="cursor-pointer flex justify-center">
        <input 
          id="imageUpload" 
          type="file" 
          accept="image/*" 
          onChange={handleImageChange} 
          className="hidden" 
        />
        <div className="text-blue-500 text-2xl bg-black px-3 py-5 rounded-xl">Upload Passport</div> 
      </label>
    </div>

      {imagePreview && (
        <div>
          {/* <h3 className='text-3xl'>Image Preview:</h3> */}
          <Image height={400} width={300} src={imagePreview} alt="Selected" style={{ maxWidth: '100%', height: 'auto' }} />
        </div>
      )}
      <button className='px-3 py-4 bg-black text-white text-xl rounded-xl' onClick={extractMRZText} disabled={!imageFile || loading}>
        {loading ? 'Scanning...' : 'Scan Passport'}
      </button>
      <div>
        <h3>MRZ Parsed Data:</h3>
        {parsedData ? (
          <div>
            {Object.entries(parsedData).map(([key, value]) => (
              <p key={key}><strong>{key}:</strong> {value}</p>
            ))}
          </div>
        ) : (
          <p>No valid MRZ data found.</p>
        )}
      </div>
    </div>
  );
};

export default ImageToText;
