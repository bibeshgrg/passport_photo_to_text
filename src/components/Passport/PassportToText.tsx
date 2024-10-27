"use client";
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

  const cleanMRZText = (text: string) => {
    // Split the text into lines and filter valid MRZ lines
    const lines = text.split('\n').filter(line => {
      // Check if the line contains only uppercase letters, digits, or '<'
      return /^[A-Z0-9<]+$/.test(line) && line.length >= 2; // Assuming MRZ lines are typically long
    });
    return lines;
  };
  

  
  // Extract MRZ text using OCR.space API
  const extractMRZText = async () => {
    if (!imageFile) return;
  
    setLoading(true);
    setParsedData(null); // Clear previous results
  
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
  
      const response = await fetch('/api/ocr_parse', {
        method: 'POST',
        body: formData,
      });
  
      const result = await response.json();
  
      if (result.error) {
        console.error('Error:', result.error);
        setParsedData(null);
        return;
      }

      console.log(result.ParsedResults[0].ParsedText);

  
      const cleanedMRZLines = cleanMRZText(result.ParsedResults[0].ParsedText);
      
      // if (cleanedMRZLines.length < 2) {
      //   console.error('Not enough valid MRZ lines found.');
      //   setParsedData(null);
      //   return;
      // }
  
      const parsedMRZ = parseMRZ(cleanedMRZLines) as MRZResult;
      const fullMRZLine = cleanedMRZLines.join(' '); // Concatenate cleaned lines
  
      if (parsedMRZ.valid) {
        const fields = parsedMRZ.fields ?? {};
        console.log("Given Names", fields.firstName?.trim().split(' ')[0] ?? undefined,)
        const selectedFields: Record<string, string | undefined> = {
          Type: fields.documentCode ?? undefined,
          "Country Code": fields.countryCode ?? undefined,
          "Passport No": fields.documentNumber ?? undefined,
          Surname: fields.lastName ?? undefined,
          firstName: fields.firstName?.trim().split(' ')[0] ?? undefined,

          Nationality: fields.nationality ?? undefined,
          "Personal No": fields.personalNumber ?? undefined,
          Sex: fields.sex ?? undefined,
          "Date of Expiry": formatDate(fields.expirationDate),
          "Date of Birth": formatDate(fields.birthDate),
          "Date of Issue": formatDate(fields.issueDate),
          "Place of Birth": fields.birthPlace ?? undefined,
          "ISSUING AUTHORITY": fields.optional2 ?? undefined,
          "Full MRZ Line": fullMRZLine,
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
      <div className='h-auto w-full px-2 py-4 flex justify-center items-center rounded-lg border-dashed border-black border-2'>
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
                if (key === "Full MRZ Line") return null; // Skip for the bottom code 
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
          <p>No MRZ data parsed yet.</p>
        )}
      </div>
    </div>
  );
};

export default ImageToText;
