import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Loader2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { createAiClient } from '../lib/gemini';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const getAiClient = () => createAiClient();

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadCreated: (lead: any) => void;
}

export default function CreateLeadModal({ isOpen, onClose, onLeadCreated }: CreateLeadModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    country: '',
    notes: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Analyze lead with Gemini
      const prompt = `
        Analyze the following manually entered lead information for a Biodiversity Regulatory Consulting company (RegulaBio).
        
        Name: ${formData.name}
        Email: ${formData.email}
        Company: ${formData.company}
        Country: ${formData.country}
        Notes/Context: ${formData.notes}
        
        Based on this information, determine:
        1. relevance: "high", "medium", or "low" based on how likely they are to need our services (e.g., cosmetics, pharma, food companies using Brazilian biodiversity are high relevance).
        2. suggestions: A short paragraph suggesting what services or approach we should offer them.
        3. riskLevel: "high", "moderate", or "low" based on their potential regulatory exposure.
        
        Return a JSON object with strictly these fields:
        - relevance (string)
        - suggestions (string)
        - riskLevel (string)
      `;

      let analysis = {
        relevance: 'medium',
        suggestions: 'No specific suggestions available.',
        riskLevel: 'moderate'
      };

      try {
        const response = await getAiClient().models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          }
        });
        
        if (response.text) {
          analysis = JSON.parse(response.text);
        }
      } catch (aiError: any) {
        console.error("Error analyzing lead with AI:", aiError);
        if (aiError?.status === 429 || aiError?.status === 'RESOURCE_EXHAUSTED' || (aiError?.message && aiError.message.includes('429'))) {
           analysis.suggestions = "AI analysis unavailable due to quota limits. Please review manually.";
        }
      }

      const newLead = {
        name: formData.name || 'Unknown',
        email: formData.email || 'unknown@example.com',
        company: formData.company || 'Unknown',
        country: formData.country || 'Unknown',
        notes: formData.notes,
        status: 'new',
        riskLevel: analysis.riskLevel || 'moderate',
        relevance: analysis.relevance || 'medium',
        suggestions: analysis.suggestions || '',
        source: 'manual',
        createdBy: auth.currentUser?.email || 'admin',
        lastEditedBy: auth.currentUser?.email || 'admin',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "diagnostic_leads"), newLead);
      
      onLeadCreated({ id: docRef.id, ...newLead, createdAt: { toMillis: () => Date.now() } });
      onClose();
      setFormData({ name: '', email: '', company: '', country: '', notes: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "diagnostic_leads");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md flex flex-col">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">{t('admin.kanban.create_lead', 'Create Lead')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.kanban.name', 'Name')}</label>
            <input 
              required
              type="text" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1b3a4b] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.kanban.email', 'Email')}</label>
            <input 
              type="email" 
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1b3a4b] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.company', 'Company')}</label>
            <input 
              type="text" 
              value={formData.company}
              onChange={e => setFormData({...formData, company: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1b3a4b] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.kanban.country', 'Country')}</label>
            <input 
              type="text" 
              value={formData.country}
              onChange={e => setFormData({...formData, country: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1b3a4b] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.kanban.notes', 'Notes / Context')}</label>
            <textarea 
              rows={3}
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              placeholder={t('admin.kanban.notes', 'Provide context for AI analysis...')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1b3a4b] focus:border-transparent"
            />
          </div>
          
          <div className="pt-4 flex justify-end gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
            >
              {t('admin.kanban.cancel', 'Cancel')}
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="bg-[#1b3a4b] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#234b61] transition-colors flex items-center gap-2 disabled:opacity-70"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? t('admin.kanban.analyzing', 'Analyzing...') : t('admin.kanban.create_lead', 'Create Lead')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
