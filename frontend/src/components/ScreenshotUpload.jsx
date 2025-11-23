import { useState } from 'react';

export default function ScreenshotUpload({ onUpload, onUrlSubmit, loading }) {
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState('');
  const [useUrl, setUseUrl] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (useUrl && url) {
      onUrlSubmit(url);
    } else if (file) {
      onUpload(file);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Upload Form Screenshot or Enter URL
        </h2>

        <div className="mb-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              checked={!useUrl}
              onChange={() => setUseUrl(false)}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-gray-700">Upload Screenshot</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer mt-2">
            <input
              type="radio"
              checked={useUrl}
              onChange={() => setUseUrl(true)}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-gray-700">Enter URL</span>
          </label>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!useUrl ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Screenshot
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                  disabled={loading}
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  {preview ? (
                    <img
                      src={preview}
                      alt="Preview"
                      className="max-h-64 rounded-lg mb-2"
                    />
                  ) : (
                    <>
                      <svg
                        className="w-12 h-12 text-gray-400 mb-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <span className="text-gray-600">
                        Click to upload or drag and drop
                      </span>
                    </>
                  )}
                </label>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Form URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/form"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (!file && !url)}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Analyzing...' : 'Analyze Form'}
          </button>
        </form>
      </div>
    </div>
  );
}

