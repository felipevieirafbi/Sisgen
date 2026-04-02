import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { GoogleGenAI, Chat } from "@google/genai";
import { createAiClient } from "../lib/gemini";
import { auth, db } from "../firebase";
import { collection, addDoc, serverTimestamp, doc, setDoc, getDocs, query, where, updateDoc } from "firebase/firestore";
import { Send, Loader2, AlertTriangle, CheckCircle, Info, Bot, User } from "lucide-react";
import { motion } from "motion/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import TextareaAutosize from "react-textarea-autosize";

const ai = createAiClient();

const SYSTEM_INSTRUCTION = `
Você é a Lumina, a assistente de IA avançada da RegulaBio, uma empresa de consultoria especializada em Regulatório de Biodiversidade no Brasil. Seu objetivo é realizar um diagnóstico preliminar para empresas sobre a necessidade de conformidade com a Lei 13.123/2015 (Lei da Biodiversidade) e o SisGen.

Seu comportamento deve ser EXTREMAMENTE humanizado, natural, empático e inteligente. Você não é um robô burocrático, você é uma consultora brilhante e acolhedora. Sugere clareza e inteligência sobre processos que geralmente são "obscuros" ou burocráticos.

REGRA ZERO — COMPORTAMENTO MULTILÍNGUE (POLIGLOTA)
1. Na primeira mensagem, cumprimente no idioma do site selecionado pelo usuário.
2. Se o usuário responder em QUALQUER outro idioma (japonês, coreano, italiano, mandarim, árabe, etc.), troque imediatamente para esse idioma e continue toda a conversa nele.
3. Mantenha o tom profissional e a terminologia regulatória precisa em todos os idiomas.
4. Os termos técnicos brasileiros (SisGen, Lei 13.123, patrimônio genético) devem ser mantidos em português com tradução/explicação no idioma do usuário entre parênteses na primeira menção.

FLUXO DA CONVERSA (Siga estritamente esta ordem, um passo de cada vez. NUNCA peça vários dados de uma vez só):

ETAPA 1 — APRESENTAÇÃO E NOME
- Apresente-se como Lumina.
- Diga que está ali para trazer clareza sobre a regulação de biodiversidade.
- Pergunte de forma amigável como a pessoa gostaria de ser chamada.
- ESPERE A RESPOSTA.

ETAPA 2 — TELEFONE/WHATSAPP
- Chame a pessoa pelo nome que ela escolheu.
- Peça o número de WhatsApp ou telefone (diga que é apenas para caso a conexão caia ou precisem falar depois).
- ESPERE A RESPOSTA.

ETAPA 3 — NOME COMPLETO
- Agradeça e peça o nome completo da pessoa para o registro.
- ESPERE A RESPOSTA.

ETAPA 4 — E-MAIL
- Peça o melhor e-mail de contato profissional.
- ESPERE A RESPOSTA.

ETAPA 5 — CNPJ E PESQUISA
- Peça o CNPJ da empresa (ou VAT/Tax ID se for estrangeira).
- ESPERE A RESPOSTA DO USUÁRIO.
- QUANDO A PESSOA INFORMAR O CNPJ OU NOME DA EMPRESA: Você DEVE usar a ferramenta de busca (Google Search) para pesquisar sobre a empresa na web. Tente entender o máximo sobre ela: o que faz, redes sociais, se já usa bioativos, extratos naturais, ingredientes da biodiversidade brasileira.
- Use o que você encontrou como um "gatilho" de conversa. Exemplo: "Pesquisei um pouco sobre a [Nome da Empresa] e vi que vocês trabalham com [produto/ingrediente]..."
- Troque uma ideia humanizada sobre o que percebeu da empresa, confirme se os dados estão de acordo com a realidade.
- IMPORTANTE: Mantenha um diálogo natural. Faça UMA PERGUNTA POR VEZ. NUNCA faça uma lista de perguntas.
- Ao longo da conversa, de forma fluida e em turnos diferentes (esperando a resposta entre cada pergunta), você DEVE OBRIGATORIAMENTE descobrir:
  1. O cargo da pessoa.
  2. O tamanho da empresa (pergunte explicitamente o número de funcionários ou porte).
  3. O site da empresa (se o e-mail tiver um domínio corporativo, pergunte se aquele é o site oficial. Se não, peça o site ou rede social principal).
  4. O faturamento anual (pergunte de forma muito delicada e contextualizada).
- Lembre-se: Diálogo! Pergunte uma coisa, espere a resposta, comente a resposta, e depois pergunte outra coisa. SEMPRE com foco no uso do patrimônio genético brasileiro.

ETAPA 6 — DIAGNÓSTICO PRELIMINAR
Com base na conversa e nas atividades da empresa, classifique a situação em:
- BAIXO RISCO: Provavelmente não se enquadra na Lei 13.123 (explique por quê).
- RISCO MODERADO: Possível necessidade de cadastro no SisGen (recomende consultoria).
- ALTO RISCO: Forte indicação de obrigação regulatória pendente (recomende ação imediata).
Apresente o diagnóstico de forma clara, empática e estruturada.

ETAPA 7 — DIRECIONAMENTO
- Após o diagnóstico, direcione a pessoa para o próximo passo ideal:
- Sugira a compra de algum curso ou vídeo da RegulaBio para entender melhor o tema.
- Ou pergunte se ela gostaria de conversar com um de nossos especialistas para aprofundar a análise.

CONHECIMENTO BASE REGULATÓRIO:
LEI 13.123/2015 (Lei da Biodiversidade):
- Regula o acesso ao patrimônio genético (PG) nativo brasileiro e ao conhecimento tradicional associado (CTA).
- Aplica-se a toda pessoa física ou jurídica, nacional ou estrangeira, que realize pesquisa ou desenvolvimento tecnológico com PG brasileiro.
- Patrimônio genético = informação de origem genética de espécies vegetais, animais, microbianas ou de outra natureza, incluindo substâncias do metabolismo.
- NÃO se aplica a espécies introduzidas/domesticadas listadas nas INs 23/2017, 3/2019, 19/2018 e 16/2019.
- Acesso = pesquisa ou desenvolvimento tecnológico sobre PG ou CTA.

OBRIGAÇÕES PRINCIPAIS:
1. Cadastro de Acesso no SisGen (autodeclaratório, antes da publicação de resultados ou do requerimento de PI).
2. Notificação de Produto Acabado ou Material Reprodutivo (antes da comercialização).
3. Repartição de Benefícios (quando há exploração econômica de produto acabado).
   - Modalidade monetária: 1% da receita líquida anual ao FNRB.
   - Acordo setorial pode reduzir para 0,1%.
4. Termo de Transferência de Material (TTM) para remessas ao exterior.

PENALIDADES:
- Multas de R$ 1.000 a R$ 10.000.000.
- Apreensão de amostras e produtos.
- Embargo ou interdição de atividade.
- Cancelamento de registro ou patente.

SisGen (Sistema Nacional de Gestão do PG):
- Sistema eletrônico mantido pelo MMA.
- Cadastro obrigatório para: pesquisa, desenvolvimento tecnológico, remessa, envio de amostras.

SETORES MAIS IMPACTADOS:
- Cosméticos e HPPC (uso de óleos, manteigas e extratos vegetais nativos).
- Farmacêutico (princípios ativos de plantas medicinais).
- Agroquímico (biodefensivos, bioinsumos).
- Alimentos e bebidas (ingredientes nativos como açaí, guaraná, castanha).
- Biotecnologia e pesquisa acadêmica.
`;

export default function Diagnostic() {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatProgress, setChatProgress] = useState(0);
  const [chatStep, setChatStep] = useState('');
  const [chat, setChat] = useState<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSendTime = useRef<number>(0);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [hasConsented, setHasConsented] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);

  useEffect(() => {
    if (!hasConsented) return;

    let unsubscribeAuth: () => void;
    
    const initChat = async () => {
      const newChat = ai.chats.create({
        model: "gemini-3.1-pro-preview",
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.7
        },
      });
      setChat(newChat);

      // Send initial greeting based on site language
      const greetingMap: Record<string, string> = {
        pt: "Olá! Eu sou a Lumina, a inteligência artificial da RegulaBio. Estou aqui para trazer clareza sobre a regulação de biodiversidade e o SisGen para o seu negócio. Para começarmos de forma mais pessoal, como você gostaria de ser chamado(a)?",
        en: "Hello! I am Lumina, RegulaBio's artificial intelligence. I'm here to bring clarity about biodiversity regulation and SisGen for your business. To start on a more personal note, how would you like to be called?",
        fr: "Bonjour ! Je suis Lumina, l'intelligence artificielle de RegulaBio. Je suis là pour apporter de la clarté sur la réglementation de la biodiversité et le SisGen pour votre entreprise. Pour commencer de manière plus personnelle, comment aimeriez-vous être appelé(e) ?",
        es: "¡Hola! Soy Lumina, la inteligencia artificial de RegulaBio. Estoy aquí para brindar claridad sobre la regulación de la biodiversidad y el SisGen para su negocio. Para comenzar de una manera más personal, ¿cómo le gustaría que lo llamen?",
        de: "Hallo! Ich bin Lumina, die künstliche Intelligenz von RegulaBio. Ich bin hier, um Klarheit über die Biodiversitätsregulierung und SisGen für Ihr Unternehmen zu schaffen. Um etwas persönlicher zu beginnen, wie möchten Sie genannt werden?"
      };

      const initialMessage = greetingMap[i18n.language] || greetingMap['en'];
      setMessages([{ role: "model", content: initialMessage }]);
      
      // Create abandoned lead if logged in
      const user = auth.currentUser;
      if (user) {
        try {
          // Check if lead already exists for this user
          const q = query(collection(db, "diagnostic_leads"), where("userId", "==", user.uid));
          const querySnapshot = await getDocs(q);
          
          if (querySnapshot.empty) {
            const docRef = await addDoc(collection(db, "diagnostic_leads"), {
              userId: user.uid,
              name: user.displayName || "Não informado",
              email: user.email || "Não informado",
              company: "Não informado",
              country: "Não informado",
              riskLevel: "low",
              conversationHistory: [{ role: "model", content: initialMessage }],
              language: i18n.language,
              siteLanguage: i18n.language,
              status: "abandoned",
              crmSyncStatus: "pending",
              contactRequested: false,
              source: "site",
              createdBy: "site",
              createdAt: serverTimestamp()
            });
            setLeadId(docRef.id);
          } else {
            // Use existing lead
            setLeadId(querySnapshot.docs[0].id);
          }
        } catch (error) {
          console.error("Error creating abandoned lead:", error);
        }
      }
    };

    initChat();
    
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [i18n.language, hasConsented]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !chat) return;

    const now = Date.now();
    if (now - lastSendTime.current < 2000) {
      // Debounce: ignore clicks if less than 2 seconds since last send
      return;
    }
    lastSendTime.current = now;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);
    setChatProgress(10);
    setChatStep(t('diag.progress.reading', 'Lumina está lendo sua mensagem...'));

    let progress = 10;
    progressIntervalRef.current = setInterval(() => {
      progress += 15;
      if (progress > 90) progress = 90;
      setChatProgress(progress);
      if (progress < 30) setChatStep(t('diag.progress.reading', 'Lumina está lendo sua mensagem...'));
      else if (progress < 50) setChatStep(t('diag.progress.analyzing', 'Lumina está analisando as informações...'));
      else if (progress < 70) setChatStep(t('diag.progress.searching', 'Lumina está consultando a base de dados regulatória...'));
      else if (progress < 85) setChatStep(t('diag.progress.web_search', 'Lumina está pesquisando na web...'));
      else setChatStep(t('diag.progress.formulating', 'Lumina está formulando a melhor resposta para você...'));
    }, 1200);

    try {
      const response = await chat.sendMessage({ message: userMessage });
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setChatProgress(100);
      setChatStep(t('diag.progress.done', 'Pronto!'));
      
      const modelMessage = response.text || t('diag.error');
      setMessages((prev) => [...prev, { role: "model", content: modelMessage }]);
      
      // Check if diagnosis is complete and save lead (simplified logic for now)
      if (modelMessage.includes("BAIXO RISCO") || modelMessage.includes("RISCO MODERADO") || modelMessage.includes("ALTO RISCO")) {
        await saveLead(modelMessage);
      }
    } catch (error: any) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      console.error("Error sending message:", error);
      
      let errorMessage = t('diag.process_error', 'Ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.');
      
      // Check for 429 Too Many Requests / Quota Exceeded
      if (
        error?.status === 429 || 
        error?.status === 'RESOURCE_EXHAUSTED' ||
        (error?.message && (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED') || error.message.includes('quota')))
      ) {
        errorMessage = t('diag.quota_error', 'O limite de uso da inteligência artificial foi atingido no momento. Por favor, aguarde alguns instantes e tente novamente.');
      }
      
      setMessages((prev) => [...prev, { role: "model", content: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveLead = async (modelMessage: string) => {
    try {
      let riskLevel = "low";
      if (modelMessage.includes("RISCO MODERADO")) riskLevel = "moderate";
      if (modelMessage.includes("ALTO RISCO")) riskLevel = "high";

      // Extract data using Gemini
      const extractionPrompt = `
        Com base na conversa a seguir, extraia as informações do usuário.
        Conversa:
        ${JSON.stringify(messages)}
        
        Retorne um objeto JSON com os seguintes campos (preencha os valores EM PORTUGUÊS DO BRASIL):
        - name (string)
        - email (string)
        - phone (string)
        - jobTitle (string: cargo da pessoa)
        - company (string: nome da empresa)
        - cnpj (string)
        - industry (string: setor de atuação da empresa)
        - companySize (string: tamanho da empresa)
        - website (string: site ou rede social)
        - country (string: país)
        - relevance (string: "high", "medium", "low" baseado na probabilidade de precisarem dos nossos serviços)
        - suggestions (string: o que devemos oferecer a eles com base nas respostas)
        - estimatedValue (string: faturamento anual da empresa, se mencionado)
        - notes (string: um resumo da conversa e contexto, incluindo detalhes específicos sobre as atividades da empresa)
        - relationshipDetails (string: uma explicação de que o cliente conversou com a Lumina e uma sugestão para o próximo passo)
        
        Se um campo não for encontrado, retorne "Não informado" para strings.
      `;

      let extractedData = {
        name: "Não informado",
        email: "Não informado",
        phone: "Não informado",
        jobTitle: "Não informado",
        company: "Não informado",
        cnpj: "Não informado",
        industry: "Não informado",
        companySize: "Não informado",
        website: "Não informado",
        country: "Não informado",
        relevance: "medium",
        suggestions: "Não informado",
        estimatedValue: "Não informado",
        notes: "Não informado",
        relationshipDetails: "Não informado"
      };

      try {
        const extractionResponse = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: extractionPrompt,
          config: {
            responseMimeType: "application/json",
          }
        });
        extractedData = JSON.parse(extractionResponse.text || "{}");
      } catch (e) {
        console.error("Error extracting data:", e);
      }

      const leadData = {
        name: extractedData.name || "Não informado",
        email: extractedData.email || "Não informado",
        phone: extractedData.phone || "Não informado",
        jobTitle: extractedData.jobTitle || "Não informado",
        company: extractedData.company || "Não informado",
        cnpj: extractedData.cnpj || "Não informado",
        industry: extractedData.industry || "Não informado",
        companySize: extractedData.companySize || "Não informado",
        website: extractedData.website || "Não informado",
        country: extractedData.country || "Não informado",
        riskLevel,
        relevance: extractedData.relevance || "medium",
        suggestions: extractedData.suggestions || "Não informado",
        estimatedValue: extractedData.estimatedValue || "Não informado",
        notes: extractedData.notes || "Não informado",
        relationshipDetails: extractedData.relationshipDetails || "Não informado",
        aiAnalysis: null,
        secretAnalysis: null,
        conversationHistory: messages,
        language: i18n.language,
        siteLanguage: i18n.language,
        status: "new",
        crmSyncStatus: "pending",
        contactRequested: false,
        source: "site",
        lastEditedBy: "site",
        updatedAt: serverTimestamp()
      };

      if (leadId) {
        await updateDoc(doc(db, "diagnostic_leads", leadId), leadData);
      } else {
        const docRef = await addDoc(collection(db, "diagnostic_leads"), {
          ...leadData,
          createdBy: "site",
          createdAt: serverTimestamp()
        });
        setLeadId(docRef.id);
      }
      
      // Trigger webhook
      fetch("/api/crm-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ riskLevel, language: i18n.language })
      }).catch(console.error);
      
    } catch (error) {
      console.error("Error saving lead:", error);
    }
  };

  if (!hasConsented) {
    return (
      <div className="flex flex-col h-[calc(100vh-64px)] bg-[#e8e0d8] items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-gray-100">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-[#1b3a4b] rounded-full flex items-center justify-center text-white mb-4">
              <Bot size={32} />
            </div>
            <h2 className="text-2xl font-bold text-[#1b3a4b] text-center">{t('diag.title', 'Diagnóstico por IA')}</h2>
            <p className="text-gray-600 text-center mt-2">
              {t('diag.consent_desc', 'Para iniciar o diagnóstico com a Lumina, nossa Inteligência Artificial, precisamos do seu consentimento.')}
            </p>
          </div>

          <div className="flex items-start mb-6">
            <div className="flex items-center h-5">
              <input
                id="consent"
                name="consent"
                type="checkbox"
                required
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                className="focus:ring-[#234b61] h-4 w-4 text-[#1b3a4b] border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="consent" className="font-medium text-gray-700">
                Li e concordo com os <a href="/terms" className="text-[#b8975a] hover:underline" target="_blank" rel="noopener noreferrer">Termos de Uso</a> e a <a href="/privacy" className="text-[#b8975a] hover:underline" target="_blank" rel="noopener noreferrer">Política de Privacidade</a>.
              </label>
            </div>
          </div>

          <button
            onClick={() => setHasConsented(true)}
            disabled={!consentChecked}
            className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#1b3a4b] hover:bg-[#234b61] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1b3a4b] disabled:opacity-50 transition-colors"
          >
            {t('diag.start', 'Iniciar Diagnóstico')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-[#e8e0d8]">
      <div className="bg-[#1b3a4b] text-white p-4 shadow-md flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">{t('diag.title')}</h1>
          <p className="text-sm text-gray-300">{t('diag.subtitle')}</p>
        </div>
      </div>

      <div className="bg-yellow-50 border-b border-yellow-200 p-3 text-sm text-yellow-800 flex items-start gap-2">
        <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" />
        <p>{t('disclaimer')}</p>
      </div>

      <div className="flex-grow overflow-y-auto p-4 space-y-6 scroll-smooth">
        {messages.map((msg, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              msg.role === "user" ? "bg-[#b8975a] text-[#1b3a4b]" : "bg-[#1b3a4b] text-white"
            }`}>
              {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div
              className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
                msg.role === "user"
                  ? "bg-[#234b61] text-white rounded-tr-none"
                  : "bg-white text-gray-800 border border-gray-200 rounded-tl-none"
              }`}
            >
              {msg.role === "user" ? (
                <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
              ) : (
                <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-gray-100 prose-pre:text-gray-800 prose-a:text-[#1b3a4b] prose-a:font-semibold">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                </div>
              )}
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 flex-row"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-[#1b3a4b] text-white">
              <Bot size={16} />
            </div>
            <div className="bg-white border border-gray-200 shadow-sm rounded-2xl rounded-tl-none p-4 flex flex-col gap-3 min-w-[250px]">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <motion.div className="w-2 h-2 bg-[#b8975a] rounded-full" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
                  <motion.div className="w-2 h-2 bg-[#b8975a] rounded-full" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} />
                  <motion.div className="w-2 h-2 bg-[#b8975a] rounded-full" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} />
                </div>
                <span className="text-sm text-gray-600 font-medium">{chatStep}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-[#b8975a] h-1.5 rounded-full transition-all duration-500 ease-out" 
                  style={{ width: `${chatProgress}%` }}
                ></div>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-gray-200 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="max-w-4xl mx-auto flex gap-3 items-end">
          <TextareaAutosize
            minRows={1}
            maxRows={5}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={t('diag.placeholder')}
            className="flex-grow p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#234b61] resize-none text-base leading-relaxed shadow-sm transition-shadow"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-[#b8975a] text-[#1b3a4b] p-3.5 rounded-xl hover:bg-[#a47248] transition-all disabled:opacity-50 flex items-center justify-center shadow-sm hover:shadow-md active:scale-95 mb-0.5"
          >
            <Send size={20} className={isLoading ? "opacity-50" : ""} />
          </button>
        </div>
        <div className="max-w-4xl mx-auto mt-2 text-center">
          <span className="text-xs text-gray-400">
            Pressione <kbd className="bg-gray-100 border border-gray-200 rounded px-1 font-mono text-[10px]">Enter</kbd> para enviar, <kbd className="bg-gray-100 border border-gray-200 rounded px-1 font-mono text-[10px]">Shift + Enter</kbd> para nova linha
          </span>
        </div>
      </div>
    </div>
  );
}
