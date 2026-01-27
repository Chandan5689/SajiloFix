import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zqmdgdzlfofzmdshfrnw.supabase.co';
const supabaseKey = 'sb_publishable_2NlJz6NQsNTarz6qDjrkTw_A8QfdLQC';
const supabase = createClient(supabaseUrl, supabaseKey);

const UploadImage = () => {
  const [file, setFile] = useState(null);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;

    const { data, error } = await supabase.storage
      .from('profile_pictures') // Replace 'images' with your bucket name
      .upload(`public/${file.name}`, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Error uploading file:', error);
    } else {
      console.log('File uploaded successfully:', data);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload Image</button>
    </div>
  );
};

export default UploadImage;
