"use client";
import React, { useState } from 'react';


const PassportToText = () => {
    const [summary, setSummary] = useState<string>('');

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const file = e.target.files[0];
            const formData = new FormData();
            formData.append('file', file);
    
            try {
                const response = await fetch('/api/parsePassport', {
                    method: 'POST',
                    body: formData,
                });
    
                if (response.ok) {
                    const data = await response.json();
                    setSummary(data.summary);
                    console.log(data.summary);
                } else {
                    console.error('Error processing document:', response.statusText);
                }
            } catch (error) {
                console.error('Error parsing the document:', error);
            }
        }
    };
    

    return (
        <div>
            <input type="file" accept="image/*" onChange={handleImageChange} />
            {summary && (
                <div>
                    <h3>Extracted Text:</h3>
                    <p>{summary}</p>
                </div>
            )}
        </div>
    );
}

export default PassportToText;
