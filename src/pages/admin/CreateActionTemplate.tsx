import React, { useState } from 'react'
    import { Layout } from '../../components/Layout'
    import { actionTemplateService } from '../../services/ActionTemplateService'
    import { ActionTemplateSchema } from '../../types/firestore-schema'
    import { PlusCircle, Save, XCircle, Plus, Trash2 } from 'lucide-react' // Import icons

    export const CreateActionTemplate: React.FC = () => {
      const [title, setTitle] = useState('');
      const [elements, setElements] = useState<
        { id: string; type: 'text' | 'file_upload' | 'approval' | 'date'; title: string; data?: any }[]
      >([]);
      const [isLoading, setIsLoading] = useState(false);
      const [error, setError] = useState<string | null>(null);
      const [success, setSuccess] = useState<boolean>(false);

      const handleAddElement = (type: 'text' | 'file_upload' | 'approval' | 'date') => {
        setElements([...elements, { id: Date.now().toString(), type, title: '', data: null }]);
      };

      const handleRemoveElement = (id: string) => {
        setElements(elements.filter((element) => element.id !== id));
      };

      const handleElementChange = (id: string, field: 'title' | 'data', value: any) => {
        setElements(
          elements.map((element) =>
            element.id === id ? { ...element, [field]: value } : element
          )
        );
      };

      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccess(false);

        try {
          const newTemplate = {
            title,
            elements: elements.map(({ id, type, title, data }) => ({ id, type, title, data })), // Prepare for saving
          };

          await actionTemplateService.createActionTemplate(newTemplate);
          setSuccess(true);
          setTitle('');
          setElements([]); // Clear the form
        } catch (err: any) {
          setError(err.message || 'Failed to create action template');
        } finally {
          setIsLoading(false);
        }
      };

      return (
        <Layout role="admin">
          <div className="container mx-auto p-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 flex items-center">
              <PlusCircle className="mr-3 text-blue-600" />
              Create Action Template
            </h1>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <strong className="font-bold">Error:</strong>
                <span className="block sm:inline"> {error}</span>
              </div>
            )}

            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
                <strong className="font-bold">Success!</strong>
                <span className="block sm:inline"> Action template created.</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
              <div className="mb-4">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Template Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="mb-4">
                <h2 className="text-lg font-semibold mb-2">Elements</h2>
                <div className="space-y-2">
                  {elements.map((element) => (
                    <div key={element.id} className="border rounded-md p-4 flex items-center">
                      <input
                        type="text"
                        value={element.title}
                        onChange={(e) => handleElementChange(element.id, 'title', e.target.value)}
                        placeholder={`Enter ${element.type} title`}
                        className="flex-1 mr-2 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
                      />
                      <span className="text-gray-600 mr-2">{element.type}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveElement(element.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex space-x-2">
                  <button
                    type="button"
                    onClick={() => handleAddElement('text')}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    <Plus className="mr-1" size={16} /> Text
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddElement('file_upload')}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    <Plus className="mr-1" size={16} /> File Upload
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddElement('approval')}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    <Plus className="mr-1" size={16} /> Approval
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddElement('date')}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    <Plus className="mr-1" size={16} /> Date
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? 'Creating...' : 'Create Template'}
                <Save className='ml-2' />
              </button>
            </form>
          </div>
        </Layout>
      );
    };
