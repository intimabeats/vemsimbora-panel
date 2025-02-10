import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Layout } from '../../components/Layout'
import {
  MessageCircle,
  Paperclip,
  Send,
  File,
  Image,
  Video,
  FileText,
  Download,
  ArrowLeft,
  ExternalLink,
  X
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { projectService } from '../../services/ProjectService'
import { userManagementService } from '../../services/UserManagementService'
import { storage } from '../../config/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

interface Message {
  id: string
  userId: string
  userName: string
  content: string
  timestamp: number
  attachments?: {
    id: string
    name: string
    url: string
    type: 'image' | 'video' | 'document' | 'link' | 'other'
    size?: number
  }[]
}

export const ProjectChat: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // States
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [project, setProject] = useState<any>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [users, setUsers] = useState<{[key: string]: string}>({})

  // Load project and messages
  useEffect(() => {
    const loadProjectData = async () => {
      try {
        if (!projectId) {
          throw new Error('Project ID is required')
        }

        setIsLoading(true)
        setError(null)

        // Fetch project data
        const projectData = await projectService.getProjectById(projectId)
        setProject(projectData)

        // Fetch project messages
        const projectMessages = await projectService.getProjectMessages(projectId)
        setMessages(projectMessages)

        // Fetch users for name mapping
        const usersResponse = await userManagementService.fetchUsers()
        const userMap = usersResponse.data.reduce((acc, user) => {
          acc[user.id] = user.name
          return acc
        }, {} as {[key: string]: string})
        setUsers(userMap)
      } catch (err: any) {
        console.error('Error loading project data:', err)
        setError(err.message || 'Failed to load project details')
      } finally {
        setIsLoading(false)
      }
    }

    loadProjectData()
  }, [projectId])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setAttachments(prev => [...prev, ...files])
  }

  // Upload file
  const uploadFile = async (file: File) => {
    const storageRef = ref(storage, `projects/${projectId}/chat/${Date.now()}_${file.name}`)
    await uploadBytes(storageRef, file)
    const url = await getDownloadURL(storageRef)

    const getFileType = (file: File) => {
      if (file.type.startsWith('image/')) return 'image'
      if (file.type.startsWith('video/')) return 'video'
      if (file.type.includes('document') || file.type.includes('pdf')) return 'document'
      return 'other'
    }

    return {
      id: Date.now().toString(),
      name: file.name,
      url,
      type: getFileType(file),
      size: file.size
    }
  }

  // Format content with clickable links
  const formatContent = (content: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g
    return content.split(urlRegex).map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline inline-flex items-center"
          >
            {part}
            <ExternalLink size={14} className="ml-1" />
          </a>
        )
      }
      return part
    })
  }

  // Send message
 const handleSendMessage = async () => {
    if (!newMessage.trim() && !attachments.length) return

    try {
      setUploadProgress(0)
      const uploadedAttachments = []

      // Upload attachments
      if (attachments.length) {
        for (let i = 0; i < attachments.length; i++) {
          const attachment = await uploadFile(attachments[i])
          uploadedAttachments.push(attachment)
          setUploadProgress(((i + 1) / attachments.length) * 100)
        }
      }

      // Create message
      const newMessageObj: Message = {
        id: Date.now().toString(),
        userId: currentUser!.uid,
        userName: currentUser!.displayName || users[currentUser!.uid] || 'Usuário',
        content: newMessage,
        timestamp: Date.now(),
        attachments: uploadedAttachments
      }

      // Add message to project
      await projectService.addProjectMessage(projectId!, newMessageObj)

      setMessages(prev => [...prev, newMessageObj])
      setNewMessage('')
      setAttachments([])
      setUploadProgress(0)
    } catch (err: any) {
      setError(err.message || 'Failed to send message')
    }
  }

  if (isLoading) {
    return <Layout role="admin" isLoading={true} />
  }

  if (error) {
    return (
      <Layout role="admin" isLoading={false}>
        <div className="container mx-auto p-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <strong className="font-bold">Erro: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout role="admin" isLoading={false}>
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-t-xl shadow-md p-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate(`/admin/projects/${projectId}`)}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="mr-2" /> Voltar ao Projeto
            </button>
            <h1 className="text-xl font-semibold text-gray-900">
              Chat: {project?.name}
            </h1>
            <div className="w-24" /> {/* Spacer for alignment */}
          </div>
        </div>

        {/* Chat Container */}
        <div 
          ref={chatContainerRef}
          className="bg-gray-50 h-[calc(100vh-300px)] overflow-y-auto p-4 border-l border-r"
        >
          {messages.map((message) => (
            <div 
              key={message.id}
              className={`flex mb-4 ${
                message.userId === currentUser?.uid ? 'justify-end' : 'justify-start'
              }`}
            >
              <div className={`max-w-[70%] ${
                message.userId === currentUser?.uid 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white'
              } rounded-lg shadow p-3`}>
                <div className="flex items-center mb-1">
                  <span className={`text-sm font-medium ${
                    message.userId === currentUser?.uid ? 'text-blue-100' : 'text-gray-600'
                  }`}>
                    {message.userName}
                  </span>
                  <span className={`text-xs ml-2 ${
                    message.userId === currentUser?.uid ? 'text-blue-200' : 'text-gray-400'
                  }`}>
                    {new Date(message.timestamp).toLocaleString()}
                  </span>
                </div>

                <div className={message.userId === currentUser?.uid ? 'text-white' : 'text-gray-700'}>
                  {formatContent(message.content)}
                </div>

                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {message.attachments.map(attachment => (
                      <div
                        key={attachment.id}
                        className="relative group border rounded-lg p-2 bg-white"
                      >
                        {attachment.type === 'image' ? (
                          <img
                            src={attachment.url}
                            alt={attachment.name}
                            className="w-full h-24 object-cover rounded"
                          />
                        ) : (
                          <div className="w-full h-24 flex items-center justify-center bg-gray-50 rounded">
                            {attachment.type === 'video' && <Video className="text-gray-400" size={24} />}
                            {attachment.type === 'document' && <FileText className="text-gray-400" size={24} />}
                            {attachment.type === 'other' && <File className="text-gray-400" size={24} />}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <a
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white hover:text-blue-200 p-2"
                            download
                          >
                            <Download size={20} />
                          </a>
                        </div>
                        <p className="mt-1 text-xs text-gray-500 truncate">
                          {attachment.name}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="bg-white rounded-b-xl shadow-md p-4">
          {/* Attachments Preview */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {attachments.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-1"
                >
                  <Paperclip size={14} className="text-gray-500" />
                  <span className="text-sm text-gray-700 truncate max-w-[150px]">
                    {file.name}
                  </span>
                  <button
                    onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                    className="text-gray-500 hover:text-red-500"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload Progress */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}

          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center text-gray-500 hover:text-gray-700"
            >
              <Paperclip size={20} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() && !attachments.length}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
