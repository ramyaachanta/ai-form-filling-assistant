export default function FormPreview({ formData, onEdit }) {
  // Handle nested form_structure
  const fields = formData?.fields || (formData?.form_structure && formData.form_structure.fields) || [];
  
  if (!formData || fields.length === 0) {
    return (
      <div className="text-center text-gray-500 py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-lg font-medium">No form data to preview</p>
      </div>
    );
  }
  
  // Use the fields directly
  const displayData = {
    fields: fields,
    actions: formData.actions || (formData.form_structure && formData.form_structure.actions) || []
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              Detected Form Fields
            </h2>
            <p className="text-gray-600 mt-1">{fields.length} field{fields.length !== 1 ? 's' : ''} detected</p>
          </div>
          {onEdit && (
            <button
              onClick={onEdit}
              className="px-5 py-2.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 shadow-sm font-medium"
            >
              Edit
            </button>
          )}
        </div>

        <div className="space-y-4">
          {displayData.fields.map((field, index) => (
            <div
              key={index}
              className="border-2 border-gray-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-lg transition-all duration-200 bg-white/50 backdrop-blur-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="font-bold text-gray-800 text-lg">
                      {field.label || 'Unlabeled Field'}
                    </span>
                    {field.required && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full border border-red-200">
                        Required
                      </span>
                    )}
                    <span className="px-3 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 text-xs font-semibold rounded-lg border border-blue-200">
                      {field.type}
                    </span>
                  </div>
                  {field.value && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-xs font-semibold text-gray-500 mb-1">Value:</p>
                      <p className="text-gray-800 font-mono text-sm">{field.value}</p>
                    </div>
                  )}
                  {field.options && field.options.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-semibold text-gray-600 mb-2">Options:</p>
                      <div className="flex flex-wrap gap-2">
                        {field.options.map((option, optIndex) => (
                          <span
                            key={optIndex}
                            className="px-3 py-1.5 bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 text-xs font-medium rounded-lg border border-gray-200"
                          >
                            {option}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {displayData.actions && displayData.actions.length > 0 && (
          <div className="mt-8 pt-8 border-t-2 border-gray-200">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span>Automation Actions</span>
            </h3>
            <div className="space-y-3">
              {displayData.actions.map((action, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200"
                >
                  <span className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs font-bold rounded-lg shadow-sm">
                    {action.type.toUpperCase()}
                  </span>
                  <span className="text-gray-800 font-medium flex-1">{action.target}</span>
                  {action.value && (
                    <span className="text-gray-600 text-sm font-medium bg-white px-3 py-1 rounded-lg border border-gray-200">
                      → {action.value}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
