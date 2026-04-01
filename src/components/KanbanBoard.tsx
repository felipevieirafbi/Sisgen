import React, { useState, useRef, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  User, 
  Building, 
  MapPin, 
  Mail, 
  MessageSquare, 
  FileText, 
  Edit, 
  Save, 
  X, 
  Zap, 
  ExternalLink,
  Loader2,
  Check,
  History,
  Globe,
  Building2,
  Phone,
  Briefcase,
  DollarSign,
  Calendar,
  Upload,
  Paperclip,
  Trash2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { GoogleGenAI } from '@google/genai';
import { createAiClient } from '../lib/gemini';
import ReactTextareaAutosize from 'react-textarea-autosize';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

const ai = createAiClient();

interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  company: string;
  cnpj?: string;
  industry?: string;
  companySize?: string;
  website?: string;
  country: string;
  status: string;
  riskLevel: string;
  relevance?: string;
  suggestions?: string;
  notes?: string;
  conversationHistory?: any[];
  relationshipDetails?: string;
  estimatedValue?: string;
  expectedCloseDate?: string;
  nextContactDate?: string;
  scheduledVisitDate?: string;
  scheduledMeetingDate?: string;
  files?: { name: string, url: string }[];
  aiAnalysis?: string;
  secretAnalysis?: string;
  createdAt?: any;
  source?: string;
  createdBy?: string;
  lastEditedBy?: string;
  updatedAt?: any;
}

interface KanbanBoardProps {
  leads: Lead[];
  onStatusChange: (leadId: string, newStatus: string) => void;
  onUpdateLead?: (leadId: string, updatedData: any) => void;
  onDeleteLead?: (leadId: string) => void;
}

const COLUMNS = [
  { id: 'abandoned', titleKey: 'admin.kanban.abandoned' },
  { id: 'new', titleKey: 'admin.kanban.new' },
  { id: 'contacting', titleKey: 'admin.kanban.contacting' },
  { id: 'meeting', titleKey: 'admin.kanban.meeting' },
  { id: 'proposal', titleKey: 'admin.kanban.proposal' },
  { id: 'negotiation', titleKey: 'admin.kanban.negotiation' },
  { id: 'won', titleKey: 'admin.kanban.won' },
  { id: 'lost', titleKey: 'admin.kanban.lost' },
  { id: 'trash', titleKey: 'admin.kanban.trash' }
];

export default function KanbanBoard({ leads, onStatusChange, onUpdateLead, onDeleteLead }: KanbanBoardProps) {
  const { t } = useTranslation();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedLead, setEditedLead] = useState<Partial<Lead>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSecretAnalyzing, setIsSecretAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStep, setAnalysisStep] = useState('');
  const [secretAnalysisProgress, setSecretAnalysisProgress] = useState(0);
  const [secretAnalysisStep, setSecretAnalysisStep] = useState('');
  const [isGeneratingMessage, setIsGeneratingMessage] = useState<'whatsapp' | 'email' | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showTrashConfirm, setShowTrashConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDraggingBoard, setIsDraggingBoard] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  useEffect(() => {
    if (!selectedLead) {
      setShowTrashConfirm(false);
      setShowDeleteConfirm(false);
    }
  }, [selectedLead]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // If scrolling vertically and not holding shift
      if (e.deltaY !== 0 && !e.shiftKey) {
        const target = e.target as HTMLElement;
        const columnContent = target.closest('.kanban-column-content');
        
        if (columnContent) {
          const hasVerticalScrollbar = columnContent.scrollHeight > columnContent.clientHeight;
          if (hasVerticalScrollbar) {
            // Let the column scroll vertically
            return;
          }
        }

        // Translate vertical wheel to horizontal scroll
        e.preventDefault();
        container.scrollLeft += e.deltaY;
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  const onMouseDownBoard = (e: React.MouseEvent) => {
    // Don't pan if clicking on a card or button
    if ((e.target as HTMLElement).closest('.kanban-card') || (e.target as HTMLElement).closest('button')) {
      return;
    }
    setIsDraggingBoard(true);
    if (scrollContainerRef.current) {
      setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
      setScrollLeft(scrollContainerRef.current.scrollLeft);
    }
  };

  const onMouseLeaveBoard = () => {
    setIsDraggingBoard(false);
  };

  const onMouseUpBoard = () => {
    setIsDraggingBoard(false);
  };

  const onMouseMoveBoard = (e: React.MouseEvent) => {
    if (!isDraggingBoard || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // Scroll speed multiplier
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    onStatusChange(draggableId, destination.droppableId);
  };

  const getLeadsByStatus = (status: string) => {
    return leads.filter(lead => lead.status === status);
  };

  const getRelevanceColor = (relevance?: string) => {
    switch (relevance?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    try {
      if (typeof date.toMillis === 'function') {
        return new Date(date.toMillis()).toLocaleString();
      }
      if (typeof date.toDate === 'function') {
        return date.toDate().toLocaleString();
      }
      if (date instanceof Date) {
        return date.toLocaleString();
      }
      if (typeof date === 'number') {
        return new Date(date).toLocaleString();
      }
      if (typeof date === 'string') {
        return new Date(date).toLocaleString();
      }
      return 'N/A';
    } catch (e) {
      return 'N/A';
    }
  };

  const formatDateShort = (date: any) => {
    const formatted = formatDate(date);
    return formatted === 'N/A' ? '' : formatted.split(',')[0];
  };

  const handleEditClick = () => {
    if (selectedLead) {
      setEditedLead({ ...selectedLead });
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedLead({});
  };

  const handleSaveEdit = async () => {
    if (selectedLead && onUpdateLead) {
      await onUpdateLead(selectedLead.id, editedLead);
      setSelectedLead({ ...selectedLead, ...editedLead });
      setIsEditing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedLead || !onUpdateLead) return;

    setIsUploading(true);
    try {
      const newFiles = [...(selectedLead.files || [])];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const storageRef = ref(storage, `leads/${selectedLead.id}/${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        newFiles.push({ name: file.name, url });
      }

      const updatedData = { files: newFiles };
      await onUpdateLead(selectedLead.id, updatedData);
      setSelectedLead({ ...selectedLead, ...updatedData });
      if (isEditing) {
        setEditedLead({ ...editedLead, ...updatedData });
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      alert(t('diag.error'));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAIAnalysis = async () => {
    if (!selectedLead) return;
    setIsAnalyzing(true);
    setAnalysisProgress(10);
    setAnalysisStep(t('admin.kanban.progress.reading'));
    
    let progress = 10;
    const interval = setInterval(() => {
      progress += 15;
      if (progress > 90) progress = 90;
      setAnalysisProgress(progress);
      if (progress < 40) setAnalysisStep(t('admin.kanban.progress.searching'));
      else if (progress < 70) setAnalysisStep(t('admin.kanban.progress.cross_ref'));
      else setAnalysisStep(t('admin.kanban.progress.consolidating'));
    }, 1500);

    try {
      const prompt = `
        Analise o seguinte lead do CRM para a RegulaBio (Consultoria Regulatória de Biodiversidade).
        
        Nome do Lead: ${selectedLead.name}
        Empresa: ${selectedLead.company}
        País: ${selectedLead.country}
        Status Atual: ${selectedLead.status}
        Notas: ${selectedLead.notes || 'N/A'}
        Detalhes do Relacionamento: ${selectedLead.relationshipDetails || 'N/A'}
        Histórico de Conversa: ${JSON.stringify(selectedLead.conversationHistory) || 'N/A'}
        
        Com base nestas informações:
        1. Proponha um plano de ação detalhado para mover este lead para a próxima etapa.
        2. Sugira serviços específicos da RegulaBio ou ofertas que seriam mais relevantes para eles.
        3. Identifique potenciais desafios regulatórios que eles possam estar enfrentando.
        4. Forneça um texto sugerido para iniciar a conversa com o cliente.
        
        INSTRUÇÃO CRÍTICA PARA IDIOMA:
        - A análise para os itens 1, 2 e 3 DEVE SER ESTRITAMENTE ESCRITA EM PORTUGUÊS DO BRASIL (PT-BR). NÃO USE INGLÊS PARA ESTES ITENS.
        - Para o item 4 (o texto sugerido para iniciar a conversa), você DEVE primeiro detectar o idioma do cliente com base no país, nome ou histórico de conversa. O texto sugerido DEVE ser escrito no idioma nativo do cliente.
        
        Formate a resposta em Markdown.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
      });

      clearInterval(interval);
      setAnalysisProgress(100);
      setAnalysisStep(t('admin.kanban.progress.done'));

      if (response.text && onUpdateLead) {
        const analysis = response.text;
        await onUpdateLead(selectedLead.id, { aiAnalysis: analysis });
        setSelectedLead({ ...selectedLead, aiAnalysis: analysis });
      }
    } catch (error: any) {
      clearInterval(interval);
      console.error("Error generating AI analysis:", error);
      if (error?.status === 429 || error?.status === 'RESOURCE_EXHAUSTED' || (error?.message && error.message.includes('429'))) {
         alert(t('diag.quota_error', 'O limite de uso da inteligência artificial foi atingido no momento. Por favor, aguarde alguns instantes e tente novamente.'));
      } else {
         alert(t('diag.error', 'Ocorreu um erro ao gerar a análise.'));
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSecretAnalysis = async () => {
    if (!selectedLead) return;
    setIsSecretAnalyzing(true);
    setSecretAnalysisProgress(10);
    setSecretAnalysisStep(t('admin.kanban.progress.reading'));
    
    let progress = 10;
    const interval = setInterval(() => {
      progress += 10;
      if (progress > 90) progress = 90;
      setSecretAnalysisProgress(progress);
      if (progress < 30) setSecretAnalysisStep(t('admin.kanban.progress.searching'));
      else if (progress < 50) setSecretAnalysisStep(t('admin.kanban.progress.linkedin'));
      else if (progress < 75) setSecretAnalysisStep(t('admin.kanban.progress.cross_ref'));
      else setSecretAnalysisStep(t('admin.kanban.progress.consolidating'));
    }, 2000);

    try {
      const prompt = `
[Contexto e Papel]
Você é um Especialista em Inteligência de Mercado B2B (OSINT) e Consultor Regulatório especializado na Lei da Biodiversidade Brasileira (Lei 13.123/2015) e SisGen. Sua missão é realizar uma varredura profunda e consolidar dados sobre empresas e seus tomadores de decisão, fornecendo insights estratégicos para uma abordagem comercial de alto nível.

[Objetivo]
Com base nos dados fornecidos, você deve pesquisar na internet (dados públicos de CNPJ, Receita Federal, Google, LinkedIn, Instagram e o site oficial da empresa) para mapear o perfil completo do negócio e da pessoa de contato. O objetivo final é identificar o nível de maturidade da empresa, seus potenciais riscos regulatórios e gerar um resumo executivo que apoie a venda de "Serviços de Diagnóstico Guiado por IA e Consultoria Especializada para conformidade com a Lei 13.123/2015 (SisGen)".

[Dados de Entrada]

Nome da Empresa: ${selectedLead.company}
CNPJ: ${selectedLead.cnpj || 'Não fornecido'}
Nome do Contato (Lead): ${selectedLead.name}
Telefone: ${selectedLead.phone || 'Não fornecido'}
E-mail: ${selectedLead.email || 'Não fornecido'}
Cargo: ${selectedLead.jobTitle || 'Não fornecido'}
Setor: ${selectedLead.industry || 'Não fornecido'}
Site: ${selectedLead.website || 'Não fornecido'}

[Instruções de Pesquisa e Análise]
Execute os seguintes passos e analise os dados coletados:

Análise Corporativa e de Atividade (Receita Federal/CNAE):
Identifique as atividades principal e secundárias (CNAE). A empresa atua em setores de alto risco para o SisGen (ex: indústria química, cosméticos, higiene, perfumaria, agricultura, farmacêutica, alimentos e bebidas)?
Verifique o porte da empresa, capital social e tempo de mercado.

Varredura de Portfólio e P&D (Site e Google):
Pesquise o portfólio de produtos da empresa. Eles usam insumos da biodiversidade brasileira (ex: óleos essenciais, extratos vegetais, manteigas naturais, ativos da Amazônia/Cerrado, etc.)?
Existem notícias ou publicações sobre Pesquisa e Desenvolvimento (P&D) interno, inovação ou lançamento de novos produtos naturais?

Mapeamento de Sustentabilidade e ESG:
A empresa possui discursos, relatórios ou certificações ligadas a sustentabilidade, ESG ou apelo ecológico/natural? (Empresas com forte apelo "verde" têm alto risco de exposição se não estiverem em conformidade com o SisGen).

Perfil do Tomador de Decisão (LinkedIn e Redes Sociais):
Pesquise pelo [Nome do Contato] no LinkedIn e Google. Qual é o seu cargo exato (ex: Diretor de P&D, Diretor de Qualidade, Assuntos Regulatórios, CEO)?
Qual é a formação profissional dessa pessoa? Ela tem um perfil técnico ou puramente comercial?

Consolide as informações encontradas em um relatório executivo com a seguinte estrutura:

1. Raio-X da Empresa: Resumo rápido (Porte, Setor, Principais CNAEs, localização).
2. Perfil do Contato: Cargo, formação e como essa pessoa costuma tomar decisões (com base em seu perfil público).
3. Gatilhos SisGen (Oportunidades): Liste as evidências encontradas (ingredientes, produtos, linhas de pesquisa, CNAEs) indicando que esta empresa precisa de conformidade com o SisGen.
4. Dores e Riscos: O que a empresa tem a perder se for multada pelo IBAMA (multas, paralisação da produção, danos à imagem ESG)?
5. Abordagem Sugerida (Quebra-gelo): Crie um parágrafo curto e persuasivo, combinando informações específicas encontradas na pesquisa (ex: o lançamento do produto X) com um convite para o diagnóstico guiado por IA, de forma consultiva e não agressiva.

Sinta-se à vontade para adicionar outras pesquisas que achar relevantes e aprimorar o resumo para facilitar ao máximo o entendimento de quem é esse cliente.

INSTRUÇÃO CRÍTICA PARA IDIOMA:
- Toda a análise (itens 1 a 4 e qualquer pesquisa adicional) DEVE SER ESTRITAMENTE ESCRITA EM PORTUGUÊS DO BRASIL (PT-BR). NÃO USE INGLÊS PARA ESTES ITENS.
- Para o item 5 (Abordagem Sugerida / Quebra-gelo), você DEVE primeiro detectar o idioma do cliente com base no país, nome ou outro contexto. O texto sugerido DEVE ser escrito no idioma nativo do cliente.

Formate a resposta em Markdown.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });

      clearInterval(interval);
      setSecretAnalysisProgress(100);
      setSecretAnalysisStep(t('admin.kanban.progress.done'));

      if (response.text && onUpdateLead) {
        const analysis = response.text;
        await onUpdateLead(selectedLead.id, { secretAnalysis: analysis });
        setSelectedLead({ ...selectedLead, secretAnalysis: analysis });
      } else {
        console.warn("No text in response. Possible safety block.", response);
        alert(t('diag.error', 'A análise retornou vazia. Pode ter sido bloqueada por filtros de segurança.'));
      }
    } catch (error: any) {
      clearInterval(interval);
      console.error("Error generating secret analysis:", error);
      if (error?.status === 429 || error?.status === 'RESOURCE_EXHAUSTED' || (error?.message && error.message.includes('429'))) {
         alert(t('diag.quota_error', 'O limite de uso da inteligência artificial foi atingido no momento. Por favor, aguarde alguns instantes e tente novamente.'));
      } else {
         alert(t('diag.error', 'Ocorreu um erro ao gerar a análise secreta.') + ' ' + (error?.message || 'Erro desconhecido'));
      }
    } finally {
      setIsSecretAnalyzing(false);
    }
  };

  const handleGenerateMessage = async (type: 'whatsapp' | 'email') => {
    if (!selectedLead) return;
    setIsGeneratingMessage(type);
    try {
      const prompt = `
        Gere uma mensagem profissional de ${type === 'whatsapp' ? 'WhatsApp' : 'E-mail'} para o seguinte lead.
        A empresa é a RegulaBio (Consultoria Regulatória de Biodiversidade).
        
        Nome do Lead: ${selectedLead.name}
        Empresa: ${selectedLead.company}
        Status Atual: ${selectedLead.status}
        Contexto da Análise de IA: ${selectedLead.aiAnalysis || 'N/A'}
        
        A mensagem deve ser:
        - Profissional, mas acessível.
        - Focada em ajudá-los com as regulamentações de biodiversidade.
        - Incluir uma chamada para ação (call to action) clara.
        - ${type === 'whatsapp' ? 'Curta e direta para leitura em dispositivos móveis.' : 'Bem estruturada com uma linha de assunto.'}
        
        INSTRUÇÃO CRÍTICA PARA IDIOMA:
        - Você DEVE primeiro detectar o idioma do cliente com base no país, nome ou outro contexto.
        - A mensagem gerada DEVE ser escrita no idioma nativo do cliente.
        
        Retorne APENAS o texto da mensagem. ${type === 'email' ? 'Inclua uma linha de Assunto (Subject:) no topo.' : ''}
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
      });

      if (response.text) {
        const message = response.text;
        if (type === 'whatsapp') {
          const encodedMessage = encodeURIComponent(message);
          window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
        } else {
          const subjectLine = message.split('\n')[0].replace('Subject:', '').trim();
          const body = message.split('\n').slice(1).join('\n').trim();
          window.open(`mailto:${selectedLead.email}?subject=${encodeURIComponent(subjectLine)}&body=${encodeURIComponent(body)}`, '_blank');
        }
      }
    } catch (error: any) {
      console.error(`Error generating ${type} message:`, error);
      if (error?.status === 429 || error?.status === 'RESOURCE_EXHAUSTED' || (error?.message && error.message.includes('429'))) {
         alert(t('diag.quota_error', 'O limite de uso da inteligência artificial foi atingido no momento. Por favor, aguarde alguns instantes e tente novamente.'));
      } else {
         alert(t('diag.error', 'Ocorreu um erro ao gerar a mensagem.'));
      }
    } finally {
      setIsGeneratingMessage(null);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <DragDropContext onDragEnd={onDragEnd}>
        <div 
          ref={scrollContainerRef}
          className={`flex gap-4 overflow-x-auto pb-4 h-full min-h-[600px] w-full kanban-scroll ${isDraggingBoard ? 'cursor-grabbing select-none' : 'cursor-grab'}`}
          onMouseDown={onMouseDownBoard}
          onMouseLeave={onMouseLeaveBoard}
          onMouseUp={onMouseUpBoard}
          onMouseMove={onMouseMoveBoard}
        >
          {COLUMNS.map(column => (
            <div key={column.id} className="flex flex-col bg-gray-100/80 rounded-xl min-w-[320px] w-[320px] h-full shadow-sm border border-gray-200/50">
              <div className="p-4 border-b border-gray-200/50 flex justify-between items-center bg-white/50 rounded-t-xl backdrop-blur-sm">
                <h3 className="font-semibold text-gray-700">{t(column.titleKey)}</h3>
                <span className="bg-white text-gray-600 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm border border-gray-100">
                  {getLeadsByStatus(column.id).length}
                </span>
              </div>
              
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 p-3 overflow-y-auto kanban-column-content kanban-scroll transition-colors duration-200 ${snapshot.isDraggingOver ? 'bg-blue-50/50' : ''}`}
                  >
                    {getLeadsByStatus(column.id).map((lead, index) => (
                      <Draggable key={lead.id} draggableId={lead.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => setSelectedLead(lead)}
                            className={`kanban-card bg-white p-4 rounded-xl shadow-sm border mb-3 cursor-pointer hover:shadow-md transition-all duration-200 group ${
                              snapshot.isDragging ? 'shadow-lg border-blue-300 ring-2 ring-blue-500/20 rotate-2 scale-105' : 'border-gray-200/80'
                            }`}
                            style={provided.draggableProps.style}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold text-gray-800 group-hover:text-petroleo transition-colors truncate pr-2">{lead.name}</h4>
                            </div>
                            
                            <div className="space-y-1 mb-3">
                              <div className="flex items-center text-xs text-gray-500">
                                <Building size={12} className="mr-1.5" />
                                <span className="truncate">{lead.company || t('admin.kanban.no_company')}</span>
                              </div>
                              <div className="flex items-center text-xs text-gray-500">
                                <Mail size={12} className="mr-1.5" />
                                <span className="truncate">{lead.email}</span>
                              </div>
                            </div>

                            <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                              <span className={`text-xs px-2 py-1 rounded-full ${getRelevanceColor(lead.relevance)}`}>
                                {t('admin.relevance')}: {lead.relevance ? t(`admin.kanban.relevance_${lead.relevance.toLowerCase()}`, lead.relevance) : 'N/A'}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                {formatDateShort(lead.createdAt)}
                              </span>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* Lead Details Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-[#1b3a4b] rounded-xl flex items-center justify-center text-white">
                  <User size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    {isEditing ? (
                      <input 
                        type="text"
                        value={editedLead.name}
                        onChange={e => setEditedLead({...editedLead, name: e.target.value})}
                        className="text-2xl font-bold text-gray-900 border-b border-[#1b3a4b] focus:outline-none bg-transparent"
                      />
                    ) : (
                      <h2 className="text-2xl font-bold text-gray-900">{selectedLead.name}</h2>
                    )}
                    <span className={`text-xs uppercase font-bold px-2 py-1 rounded-full ${getRelevanceColor(selectedLead.relevance)}`}>
                      {selectedLead.relevance ? t(`admin.kanban.relevance_${selectedLead.relevance.toLowerCase()}`, selectedLead.relevance) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-gray-500">
                    <span className="flex items-center gap-1 text-sm">
                      <Building size={14} />
                      {isEditing ? (
                        <div className="flex gap-2">
                          <input 
                            type="text"
                            value={editedLead.company}
                            onChange={e => setEditedLead({...editedLead, company: e.target.value})}
                            className="border-b border-gray-300 focus:outline-none bg-transparent"
                            placeholder={t('admin.kanban.company')}
                          />
                          <input 
                            type="text"
                            value={editedLead.cnpj || ''}
                            onChange={e => setEditedLead({...editedLead, cnpj: e.target.value})}
                            className="border-b border-gray-300 focus:outline-none bg-transparent w-32"
                            placeholder="CNPJ"
                          />
                        </div>
                      ) : (
                        <>{selectedLead.company || 'N/A'} {selectedLead.cnpj ? `(${selectedLead.cnpj})` : ''}</>
                      )}
                    </span>
                    <span className="flex items-center gap-1 text-sm">
                      <Mail size={14} />
                      {isEditing ? (
                        <input 
                          type="email"
                          value={editedLead.email}
                          onChange={e => setEditedLead({...editedLead, email: e.target.value})}
                          className="border-b border-gray-300 focus:outline-none bg-transparent"
                          placeholder={t('admin.kanban.email')}
                        />
                      ) : (
                        selectedLead.email
                      )}
                    </span>
                    <span className="flex items-center gap-1 text-sm">
                      <Phone size={14} />
                      {isEditing ? (
                        <input 
                          type="text"
                          value={editedLead.phone || ''}
                          onChange={e => setEditedLead({...editedLead, phone: e.target.value})}
                          className="border-b border-gray-300 focus:outline-none bg-transparent"
                          placeholder={t('admin.kanban.phone')}
                        />
                      ) : (
                        selectedLead.phone || 'N/A'
                      )}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <button 
                      onClick={handleSaveEdit}
                      className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      title={t('admin.kanban.save')}
                    >
                      <Save size={20} />
                    </button>
                    <button 
                      onClick={handleCancelEdit}
                      className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors"
                      title={t('admin.kanban.cancel')}
                    >
                      <X size={20} />
                    </button>
                  </>
                ) : (
                  <>
                    {selectedLead.status === 'trash' ? (
                      showDeleteConfirm ? (
                        <div className="flex items-center gap-2 bg-red-50 p-1 rounded-lg border border-red-200">
                          <span className="text-sm text-red-700 font-medium px-2">{t('admin.kanban.confirm_delete_permanently', 'Are you sure?')}</span>
                          <button 
                            onClick={() => {
                              if (onDeleteLead) onDeleteLead(selectedLead.id);
                              setSelectedLead(null);
                              setShowDeleteConfirm(false);
                            }}
                            className="p-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                          >
                            <Check size={16} />
                          </button>
                          <button 
                            onClick={() => setShowDeleteConfirm(false)}
                            className="p-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setShowDeleteConfirm(true)}
                          className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          title={t('admin.kanban.delete_permanently', 'Excluir definitivamente')}
                        >
                          <Trash2 size={20} />
                        </button>
                      )
                    ) : (
                      showTrashConfirm ? (
                        <div className="flex items-center gap-2 bg-red-50 p-1 rounded-lg border border-red-200">
                          <span className="text-sm text-red-700 font-medium px-2">{t('admin.kanban.confirm_move_to_trash', 'Move to trash?')}</span>
                          <button 
                            onClick={() => {
                              onStatusChange(selectedLead.id, 'trash');
                              setSelectedLead(null);
                              setShowTrashConfirm(false);
                            }}
                            className="p-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                          >
                            <Check size={16} />
                          </button>
                          <button 
                            onClick={() => setShowTrashConfirm(false)}
                            className="p-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setShowTrashConfirm(true)}
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                          title={t('admin.kanban.move_to_trash', 'Mover para lixeira')}
                        >
                          <Trash2 size={20} />
                        </button>
                      )
                    )}
                    {!showDeleteConfirm && !showTrashConfirm && (
                      <button 
                        onClick={handleEditClick}
                        className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                        title={t('admin.kanban.edit')}
                      >
                        <Edit size={20} />
                      </button>
                    )}
                  </>
                )}
                <button 
                  onClick={() => {
                    setSelectedLead(null);
                    setIsEditing(false);
                  }} 
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            
            {/* Modal Body */}
            <div className="p-8 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: CRM Fields */}
                <div className="lg:col-span-2 space-y-8">
                  <section>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <FileText size={20} className="text-[#1b3a4b]" />
                      {t('admin.kanban.crm_fields')}
                    </h3>
                    
                    {/* New CRM Fields Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">{t('admin.kanban.job_title')}</label>
                        {isEditing ? (
                          <input type="text" value={editedLead.jobTitle || ''} onChange={e => setEditedLead({...editedLead, jobTitle: e.target.value})} className="w-full border-b border-gray-300 focus:border-[#1b3a4b] focus:outline-none bg-transparent py-1 text-sm" />
                        ) : (
                          <div className="text-sm font-medium text-gray-800 flex items-center gap-2"><Briefcase size={14} className="text-gray-400"/> {selectedLead.jobTitle || 'N/A'}</div>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">CNPJ</label>
                        {isEditing ? (
                          <input type="text" value={editedLead.cnpj || ''} onChange={e => setEditedLead({...editedLead, cnpj: e.target.value})} className="w-full border-b border-gray-300 focus:border-[#1b3a4b] focus:outline-none bg-transparent py-1 text-sm" />
                        ) : (
                          <div className="text-sm font-medium text-gray-800 flex items-center gap-2"><Building2 size={14} className="text-gray-400"/> {selectedLead.cnpj || 'N/A'}</div>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">{t('admin.kanban.industry')}</label>
                        {isEditing ? (
                          <input type="text" value={editedLead.industry || ''} onChange={e => setEditedLead({...editedLead, industry: e.target.value})} className="w-full border-b border-gray-300 focus:border-[#1b3a4b] focus:outline-none bg-transparent py-1 text-sm" />
                        ) : (
                          <div className="text-sm font-medium text-gray-800 flex items-center gap-2"><Building2 size={14} className="text-gray-400"/> {selectedLead.industry || 'N/A'}</div>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">{t('admin.kanban.company_size')}</label>
                        {isEditing ? (
                          <input type="text" value={editedLead.companySize || ''} onChange={e => setEditedLead({...editedLead, companySize: e.target.value})} className="w-full border-b border-gray-300 focus:border-[#1b3a4b] focus:outline-none bg-transparent py-1 text-sm" />
                        ) : (
                          <div className="text-sm font-medium text-gray-800">{selectedLead.companySize || 'N/A'}</div>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">{t('admin.kanban.website')}</label>
                        {isEditing ? (
                          <input type="text" value={editedLead.website || ''} onChange={e => setEditedLead({...editedLead, website: e.target.value})} className="w-full border-b border-gray-300 focus:border-[#1b3a4b] focus:outline-none bg-transparent py-1 text-sm" />
                        ) : (
                          <div className="text-sm font-medium text-gray-800 flex items-center gap-2"><Globe size={14} className="text-gray-400"/> {selectedLead.website ? <a href={selectedLead.website.startsWith('http') ? selectedLead.website : `https://${selectedLead.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{selectedLead.website}</a> : 'N/A'}</div>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">{t('admin.kanban.estimated_value')}</label>
                        {isEditing ? (
                          <input type="text" value={editedLead.estimatedValue || ''} onChange={e => setEditedLead({...editedLead, estimatedValue: e.target.value})} className="w-full border-b border-gray-300 focus:border-[#1b3a4b] focus:outline-none bg-transparent py-1 text-sm" />
                        ) : (
                          <div className="text-sm font-medium text-gray-800 flex items-center gap-2"><DollarSign size={14} className="text-gray-400"/> {selectedLead.estimatedValue || 'N/A'}</div>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">{t('admin.kanban.expected_close_date')}</label>
                        {isEditing ? (
                          <input type="date" value={editedLead.expectedCloseDate || ''} onChange={e => setEditedLead({...editedLead, expectedCloseDate: e.target.value})} className="w-full border-b border-gray-300 focus:border-[#1b3a4b] focus:outline-none bg-transparent py-1 text-sm" />
                        ) : (
                          <div className="text-sm font-medium text-gray-800 flex items-center gap-2"><Calendar size={14} className="text-gray-400"/> {selectedLead.expectedCloseDate ? new Date(selectedLead.expectedCloseDate).toLocaleDateString() : 'N/A'}</div>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">{t('admin.kanban.next_contact_date')}</label>
                        {isEditing ? (
                          <input type="datetime-local" value={editedLead.nextContactDate || ''} onChange={e => setEditedLead({...editedLead, nextContactDate: e.target.value})} className="w-full border-b border-gray-300 focus:border-[#1b3a4b] focus:outline-none bg-transparent py-1 text-sm" />
                        ) : (
                          <div className="text-sm font-medium text-gray-800 flex items-center gap-2"><Calendar size={14} className="text-gray-400"/> {selectedLead.nextContactDate ? new Date(selectedLead.nextContactDate).toLocaleString() : 'N/A'}</div>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">{t('admin.kanban.scheduled_visit_date')}</label>
                        {isEditing ? (
                          <input type="datetime-local" value={editedLead.scheduledVisitDate || ''} onChange={e => setEditedLead({...editedLead, scheduledVisitDate: e.target.value})} className="w-full border-b border-gray-300 focus:border-[#1b3a4b] focus:outline-none bg-transparent py-1 text-sm" />
                        ) : (
                          <div className="text-sm font-medium text-gray-800 flex items-center gap-2"><Calendar size={14} className="text-gray-400"/> {selectedLead.scheduledVisitDate ? new Date(selectedLead.scheduledVisitDate).toLocaleString() : 'N/A'}</div>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">{t('admin.kanban.scheduled_meeting_date')}</label>
                        {isEditing ? (
                          <input type="datetime-local" value={editedLead.scheduledMeetingDate || ''} onChange={e => setEditedLead({...editedLead, scheduledMeetingDate: e.target.value})} className="w-full border-b border-gray-300 focus:border-[#1b3a4b] focus:outline-none bg-transparent py-1 text-sm" />
                        ) : (
                          <div className="text-sm font-medium text-gray-800 flex items-center gap-2"><Calendar size={14} className="text-gray-400"/> {selectedLead.scheduledMeetingDate ? new Date(selectedLead.scheduledMeetingDate).toLocaleString() : 'N/A'}</div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{t('admin.kanban.notes')}</label>
                        {isEditing ? (
                          <ReactTextareaAutosize 
                            value={editedLead.notes}
                            onChange={e => setEditedLead({...editedLead, notes: e.target.value})}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1b3a4b] focus:border-transparent min-h-[100px]"
                          />
                        ) : (
                          <div className="p-4 bg-gray-50 rounded-xl text-gray-700 whitespace-pre-wrap text-sm">
                            {selectedLead.notes || t('admin.kanban.no_notes')}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{t('admin.kanban.relationship')}</label>
                        {isEditing ? (
                          <ReactTextareaAutosize 
                            value={editedLead.relationshipDetails}
                            onChange={e => setEditedLead({...editedLead, relationshipDetails: e.target.value})}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1b3a4b] focus:border-transparent min-h-[80px]"
                          />
                        ) : (
                          <div className="p-4 bg-gray-50 rounded-xl text-gray-700 whitespace-pre-wrap text-sm">
                            {selectedLead.relationshipDetails || t('admin.kanban.no_details')}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{t('admin.kanban.history')}</label>
                        {isEditing ? (
                          <ReactTextareaAutosize 
                            value={editedLead.conversationHistory ? JSON.stringify(editedLead.conversationHistory, null, 2) : ''}
                            onChange={e => {
                              try {
                                setEditedLead({...editedLead, conversationHistory: JSON.parse(e.target.value)});
                              } catch (err) {
                                // Just update as string if not valid JSON yet
                              }
                            }}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1b3a4b] focus:border-transparent min-h-[120px] font-mono text-xs"
                            placeholder="JSON format for history..."
                          />
                        ) : (
                          <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                            {selectedLead.conversationHistory && selectedLead.conversationHistory.length > 0 ? (
                              selectedLead.conversationHistory.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                  <div className={`max-w-[80%] rounded-lg p-3 text-xs ${
                                    msg.role === 'user' 
                                      ? 'bg-[#1b3a4b] text-white rounded-tr-none' 
                                      : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                                  }`}>
                                    {msg.content}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-gray-500 italic">{t('admin.kanban.no_history')}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* AI Analysis Section */}
                  <section className="bg-[#1b3a4b]/5 rounded-2xl p-6 border border-[#1b3a4b]/10">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-[#1b3a4b] flex items-center gap-2">
                        <Zap size={20} />
                        {t('admin.kanban.ai_analysis')}
                      </h3>
                      <button 
                        onClick={handleAIAnalysis}
                        disabled={isAnalyzing}
                        className="flex items-center gap-2 px-4 py-2 bg-[#1b3a4b] text-white rounded-lg text-sm font-medium hover:bg-[#234b61] transition-colors disabled:opacity-50"
                      >
                        {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                        {isAnalyzing ? t('admin.kanban.analyzing') : t('admin.kanban.run_analysis')}
                      </button>
                    </div>
                    {isAnalyzing ? (
                      <div className="py-8">
                        <div className="flex justify-between text-sm text-[#1b3a4b] mb-2 font-medium">
                          <span>{analysisStep}</span>
                          <span>{analysisProgress}%</span>
                        </div>
                        <div className="w-full bg-[#1b3a4b]/10 rounded-full h-2.5 overflow-hidden">
                          <div 
                            className="bg-[#1b3a4b] h-2.5 rounded-full transition-all duration-500 ease-out" 
                            style={{ width: `${analysisProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    ) : selectedLead.aiAnalysis ? (
                      <div className="prose prose-sm max-w-none text-gray-700">
                        <Markdown remarkPlugins={[remarkGfm]}>{selectedLead.aiAnalysis}</Markdown>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">
                        {t('admin.kanban.no_analysis')}
                      </p>
                    )}
                  </section>

                  {/* Secret Analysis Section */}
                  <section className="bg-purple-50 rounded-2xl p-6 border border-purple-100">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-purple-900 flex items-center gap-2">
                        <Zap size={20} className="text-purple-600" />
                        {t('admin.kanban.secret_analysis')}
                      </h3>
                      <button 
                        onClick={handleSecretAnalysis}
                        disabled={isSecretAnalyzing}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
                      >
                        {isSecretAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                        {isSecretAnalyzing ? t('admin.kanban.analyzing') : t('admin.kanban.run_secret_analysis')}
                      </button>
                    </div>
                    {isSecretAnalyzing ? (
                      <div className="py-8">
                        <div className="flex justify-between text-sm text-purple-900 mb-2 font-medium">
                          <span>{secretAnalysisStep}</span>
                          <span>{secretAnalysisProgress}%</span>
                        </div>
                        <div className="w-full bg-purple-200 rounded-full h-2.5 overflow-hidden">
                          <div 
                            className="bg-purple-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
                            style={{ width: `${secretAnalysisProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    ) : selectedLead.secretAnalysis ? (
                      <div className="prose prose-sm max-w-none text-gray-700">
                        <Markdown remarkPlugins={[remarkGfm]}>{selectedLead.secretAnalysis}</Markdown>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">
                        {t('admin.kanban.no_secret_analysis')}
                      </p>
                    )}
                  </section>
                </div>

                {/* Right Column: Actions & Audit */}
                <div className="space-y-6">
                  {/* Quick Actions */}
                  <section>
                    <h3 className="text-sm font-bold text-gray-400 uppercase mb-3">{t('admin.kanban.quick_actions')}</h3>
                    <div className="grid grid-cols-1 gap-3">
                      <button 
                        onClick={() => handleGenerateMessage('whatsapp')}
                        disabled={!!isGeneratingMessage}
                        className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
                      >
                        {isGeneratingMessage === 'whatsapp' ? <Loader2 size={18} className="animate-spin" /> : <MessageSquare size={18} />}
                        {t('admin.kanban.send_whatsapp')}
                      </button>
                      <button 
                        onClick={() => handleGenerateMessage('email')}
                        disabled={!!isGeneratingMessage}
                        className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
                      >
                        {isGeneratingMessage === 'email' ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
                        {t('admin.kanban.send_email')}
                      </button>
                    </div>
                  </section>

                  {/* Status Selector */}
                  <section>
                    <h3 className="text-sm font-bold text-gray-400 uppercase mb-3">{t('admin.status')}</h3>
                    <select 
                      value={selectedLead.status}
                      onChange={(e) => {
                        onStatusChange(selectedLead.id, e.target.value);
                        setSelectedLead({...selectedLead, status: e.target.value});
                      }}
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-[#1b3a4b] focus:outline-none text-sm"
                    >
                      {COLUMNS.map(col => (
                        <option key={col.id} value={col.id}>{t(col.titleKey)}</option>
                      ))}
                    </select>
                  </section>

                  {/* Audit Info */}
                  <section className="bg-gray-50 rounded-2xl p-6 space-y-4">
                    <h3 className="text-sm font-bold text-gray-400 uppercase mb-1">{t('admin.kanban.audit')}</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Globe size={12} /> {t('admin.kanban.source')}
                        </span>
                        <span className="text-xs font-medium text-gray-700 uppercase">{selectedLead.source || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <User size={12} /> {t('admin.kanban.created_by')}
                        </span>
                        <span className="text-xs font-medium text-gray-700 truncate max-w-[120px]" title={selectedLead.createdBy}>{selectedLead.createdBy || 'System'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Edit size={12} /> {t('admin.kanban.last_editor')}
                        </span>
                        <span className="text-xs font-medium text-gray-700 truncate max-w-[120px]" title={selectedLead.lastEditedBy}>{selectedLead.lastEditedBy || 'System'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock size={12} /> {t('admin.kanban.last_update')}
                        </span>
                        <span className="text-xs font-medium text-gray-700">
                          {formatDate(selectedLead.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

