import { useTranslation } from 'react-i18next';

export default function PrivacyPolicy() {
  const { t } = useTranslation();

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#e8e0d8] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-xl shadow-lg border border-gray-100 prose prose-slate">
        <h1 className="text-3xl font-bold text-[#1b3a4b] mb-6">Política de Privacidade</h1>
        
        <p className="text-gray-600 mb-4">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[#234b61] mb-3">1. Introdução</h2>
          <p>
            A RegulaBio valoriza a privacidade de seus usuários e está comprometida em proteger seus dados pessoais. Esta Política de Privacidade explica como coletamos, usamos, compartilhamos e protegemos suas informações de acordo com a Lei Geral de Proteção de Dados Pessoais (LGPD - Lei nº 13.709/2018) e outras legislações aplicáveis.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[#234b61] mb-3">2. Dados Coletados</h2>
          <p>Coletamos os seguintes tipos de dados:</p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Dados de Cadastro:</strong> Nome, e-mail, telefone, empresa e cargo fornecidos voluntariamente durante o registro ou uso do nosso diagnóstico por IA.</li>
            <li><strong>Logs de Acesso:</strong> Endereço IP, data e hora de acesso, conforme exigido pelo Marco Civil da Internet (Lei nº 12.965/2014), armazenados por no mínimo 6 meses.</li>
            <li><strong>Dados de Uso:</strong> Informações sobre como você interage com nosso site e serviços.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[#234b61] mb-3">3. Finalidade do Tratamento</h2>
          <p>Utilizamos seus dados para:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Fornecer e melhorar nossos serviços de consultoria regulatória.</li>
            <li>Realizar diagnósticos preliminares através de nossa Inteligência Artificial.</li>
            <li>Cumprir obrigações legais e regulatórias.</li>
            <li>Comunicar sobre atualizações, novos serviços ou informações relevantes.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[#234b61] mb-3">4. Compartilhamento de Dados</h2>
          <p>
            A RegulaBio não vende seus dados pessoais. Podemos compartilhar informações apenas com provedores de serviços essenciais (como hospedagem e serviços de IA) que operam sob estritos acordos de confidencialidade e conformidade com a LGPD.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[#234b61] mb-3">5. Seus Direitos (LGPD)</h2>
          <p>Você tem o direito de:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Confirmar a existência de tratamento de dados.</li>
            <li>Acessar seus dados.</li>
            <li>Corrigir dados incompletos, inexatos ou desatualizados.</li>
            <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários.</li>
            <li>Revogar o consentimento a qualquer momento.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[#234b61] mb-3">6. Contato do Encarregado de Dados (DPO)</h2>
          <p>
            Para exercer seus direitos ou tirar dúvidas sobre esta Política de Privacidade, entre em contato com nosso Encarregado pelo Tratamento de Dados Pessoais (DPO) através do e-mail:
          </p>
          <p className="font-semibold mt-2">
            <a href="mailto:dpo@regulabio.com.br" className="text-[#b8975a] hover:underline">dpo@regulabio.com.br</a>
          </p>
        </section>
      </div>
    </div>
  );
}
