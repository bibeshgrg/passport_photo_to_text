"use client"
import React, { useState } from 'react';
import Tesseract from 'tesseract.js';

const TextExtractor: React.FC = () => {
  const [image, setImage] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setImage(event.target.files[0]);
    }
  };

  const extractText = () => {
    if (image) {
      Tesseract.recognize(
        image,
        'eng', // Specify the language
        {
          logger: (m) => console.log(m), // Optional: log progress
        }
      )
      .then(({ data: { text } }) => {
        // Split the extracted text into lines
        const lines = text.split('\n').map(line => line.trim()).filter(line => line !== '');

        // Define headers and initialize extracted data object
        const headers = [
          'Type', 'Country Code', 'Passport No', 'Surname',
          'Given Name', 'Nationality', 'Personal No.', 'Sex',
          'DATE OF ISSUE', 'DATE OF BIRTH', 'DATE OF EXPIRY',
          'PLACE OF BIRTH', 'ISSUE AUTHORITY'
        ];
        const extractedData: { [key: string]: string } = {};

        // Loop through the lines and capture data based on known headers
        let currentHeader = '';
        lines.forEach(line => {
          // Check if the line is a header
          if (headers.includes(line)) {
            currentHeader = line; // Set the current header
          } else if (currentHeader) {
            // If there's a current header, assign the line as its value
            extractedData[currentHeader] = line;
            currentHeader = ''; // Reset after assigning value
          }
        });

        // Format the extracted data for display
        setExtractedText(JSON.stringify(extractedData, null, 2));
      })
      .catch(err => {
        console.error(err);
        setExtractedText('Error extracting text');
      });
    }
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleImageChange} />
      <button onClick={extractText}>Extract Text</button>
      {extractedText && (
        <pre>
          <code>{extractedText}</code>
        </pre>
      )}
    </div>
  );
};

export default TextExtractor;
