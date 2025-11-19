import React from 'react';
import UploadForm from '../components/UploadForm';

export default function Home() {
  return (
    <div className="page-card">
      <h2 style={{ marginTop: 0 }}>Analyze Your Rooftop</h2>
      <p style={{ color: '#475569' }}>
        Upload a photo or use your camera to analyze rooftop and get tailored recommendations.
      </p>

      <UploadForm />
    </div>
  );
}
