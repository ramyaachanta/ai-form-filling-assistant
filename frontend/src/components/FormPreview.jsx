export default function FormPreview({ formData, onEdit }) {
  if (!formData || !formData.fields) {
    return (
      <div className="text-center text-gray-500 py-8">
        No form data to preview
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            Detected Form Fields
          </h2>
          {onEdit && (
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Edit
            </button>
          )}
        </div>

        <div className="space-y-4">
          {formData.fields.map((field, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-semibold text-gray-800">
                      {field.label || 'Unlabeled Field'}
                    </span>
                    {field.required && (
                      <span className="text-red-500 text-sm">*</span>
                    )}
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {field.type}
                    </span>
                  </div>
                  {field.value && (
                    <p className="text-gray-600 text-sm">
                      Value: <span className="font-mono">{field.value}</span>
                    </p>
                  )}
                  {field.options && field.options.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">Options:</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {field.options.map((option, optIndex) => (
                          <span
                            key={optIndex}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
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

        {formData.actions && formData.actions.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Automation Actions
            </h3>
            <div className="space-y-2">
              {formData.actions.map((action, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                >
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                    {action.type.toUpperCase()}
                  </span>
                  <span className="text-gray-700">{action.target}</span>
                  {action.value && (
                    <span className="text-gray-500 text-sm">
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

