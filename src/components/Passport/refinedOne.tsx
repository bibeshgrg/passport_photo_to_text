"use client";
import Tesseract from 'tesseract.js';
import { useState } from 'react';
import Image from 'next/image';
import { parse as parseMRZ } from 'mrz';
import { TextField } from '@mui/material';

// Define an interface for MRZResult
interface MRZResult {
  valid: boolean;
  fields: {
    documentCode?: string;
    countryCode?: string;
    documentNumber?: string;
    firstName?: string;
    lastName?: string;
    optional?: string;
    nationality?: string;
    issueDate?: string;
    personalNumber?: string;
    sex?: string;
    expirationDate?: string;
    birthDate?: string;
    birthPlace?: string;
    optional2?: string;
  };
}

// Helper function to format dates in YYMMDD format to DD MMM YYYY
const formatDate = (dateString: string | undefined) => {
  if (!dateString || dateString.length !== 6) return dateString;
  const year = parseInt(dateString.slice(0, 2), 10);
  const month = parseInt(dateString.slice(2, 4), 10) - 1; // Month is 0-indexed
  const day = parseInt(dateString.slice(4, 6), 10);
  
  // Adjust for years in the 2000s or 1900s
  const fullYear = year < 50 ? 2000 + year : 1900 + year;

  return new Date(fullYear, month, day).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

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

// Helper to sanitize MRZ text by ensuring line lengths are correct for MRZ formatting
const sanitizeText = (text: string) => {
  return text
    .split('\n')
    .map((line) => line.replace(/[^A-Z0-9<]/g, ''))
    .filter((line) => line.length === 44 || line.length === 36);
};



const extractMRZText = async () => {
  if (!imageFile) return;

  setLoading(true);

  try {
    const { data: { text } } = await Tesseract.recognize(imageFile, 'eng', {
      logger: () => console.log(),
    });

    console.log("Raw OCR text:", text);

    const sanitizedLines = sanitizeText(text);
    if (sanitizedLines.length < 2) {
      console.error("Extracted text does not contain valid MRZ lines.");
      setParsedData(null);
      setLoading(false);
      return;
    }

    // Parse sanitized MRZ lines
    const parsedMRZ = parseMRZ(sanitizedLines) as MRZResult;
    const fullMRZLine = sanitizedLines.join('');
    const updatedMrzLine = fullMRZLine.replace("CLCCLLLLLLLLLLLLLLLLLL", "<<<<<<<<<<<<<<<<<");

    if (parsedMRZ.valid) {
      const fields = parsedMRZ.fields ?? {};
      const selectedFields: Record<string, string | undefined> = {
        Type: fields.documentCode ?? undefined,
        "Country Code": fields.countryCode ?? undefined,
        "Passport No": fields.documentNumber ?? undefined,
        Surname: fields.lastName ?? undefined,
        "Given Names": fields.firstName?.trim().split(' ')[0] ?? undefined,
        Nationality: fields.nationality ?? undefined,
        "Personal No": fields.personalNumber ?? undefined,
        Sex: fields.sex ?? undefined,
        "Date of Expiry": formatDate(fields.expirationDate),
        "Date of Birth": formatDate(fields.birthDate),
        "Date of Issue": formatDate(fields.issueDate),
        "Place of Birth": fields.birthPlace ?? undefined,
        "ISSUING AUTHORITY": fields.optional2 ?? undefined,
        "Full MRZ Line": updatedMrzLine,
      };

      setParsedData(selectedFields);
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
      <div className='h-auto w-full px-2 py-4 flex justify-center items-center rounded-lg border-dashed border-black border-2 '>
      {imagePreview && (
        <div>
          <Image height={400} width={300} src={imagePreview} alt="Selected" style={{ maxWidth: '100%', height: 'auto' }} />
        </div>
      )}
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
          <div className="text-white text-xl font-light bg-black px-2 py-4 rounded-xl">Upload Passport</div> 
        </label>
      </div>

   
      <button className='px-3 py-4 bg-black text-white text-xl rounded-xl' onClick={extractMRZText} disabled={!imageFile || loading}>
        {loading ? 'Scanning...' : 'Scan Passport'}
      </button>
      <div className='flex flex-col space-y-3'>
        <h3>MRZ Parsed Data:</h3>
        {parsedData ? (
          <div>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(parsedData).map(([key, value]) => {
                if (key === "Full MRZ Line") return null; // i am Skipping for the bottom code 
                return (
                  <div key={key} className="flex items-center">
                    <TextField
                      
                      id={`outlined-required-${key}`}
                      label={key}
                      defaultValue={value}
                      fullWidth 
                    />
                  </div>
                );
              })}
            </div>
            <div className="mt-4"> 
              <TextField
                
                id="full-mrz-line"
                label="Full MRZ Line"
                defaultValue={parsedData["Full MRZ Line"]}
                fullWidth 
              />
            </div>
          </div>
        ) : (
          <p></p>
        )}
      </div>
    </div>
  );
};

export default ImageToText;
