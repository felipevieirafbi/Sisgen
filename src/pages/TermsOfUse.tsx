import { useTranslation } from 'react-i18next';

export default function TermsOfUse() {
  const { t } = useTranslation();

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#e8e0d8] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-xl shadow-lg border border-gray-100 prose prose-slate">
        <h1 className="text-3xl font-bold text-[#1b3a4b] mb-6">Termos de Uso</h1>
        
        <p className="text-gray-600 mb-4">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[#234b61] mb-3">1. Aceitação dos Termos</h2>
          <p>
            Ao acessar e utilizar o site e os serviços da RegulaBio, você concorda em cumprir estes Termos de Uso, bem como nossa Política de Privacidade. Se você não concordar com qualquer parte destes termos, não deverá utilizar nossos serviços.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[#234b61] mb-3">2. Descrição dos Serviços</h2>
          <p>
            A RegulaBio oferece consultoria especializada em Regulatório de Biodiversidade no Brasil, incluindo diagnósticos preliminares realizados por Inteligência Artificial (Lumina), cursos, treinamentos e serviços de adequação à Lei 13.123/2015 (Lei da Biodiversidade) e ao SisGen.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[#234b61] mb-3">3. Uso do Diagnóstico por IA</h2>
          <p>
            O diagnóstico preliminar fornecido pela nossa Inteligência Artificial (Lumina) tem caráter informativo e orientativo. Ele não substitui uma consultoria jurídica ou técnica formal e aprofundada. A RegulaBio não se responsabiliza por decisões tomadas exclusivamente com base no diagnóstico preliminar.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[#234b61] mb-3">4. Responsabilidades do Usuário</h2>
          <p>Você concorda em:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Fornecer informações verdadeiras, exatas, atuais e completas ao utilizar nossos serviços.</li>
            <li>Manter a confidencialidade de suas credenciais de acesso (login e senha).</li>
            <li>Não utilizar o site para fins ilegais, não autorizados ou que violem os direitos de terceiros.</li>
            <li>Não tentar interferir na segurança ou no funcionamento adequado do site e de nossos sistemas.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[#234b61] mb-3">5. Propriedade Intelectual</h2>
          <p>
            Todo o conteúdo presente no site da RegulaBio, incluindo textos, gráficos, logotipos, ícones, imagens, clipes de áudio, downloads digitais, compilações de dados e software, é de propriedade exclusiva da RegulaBio ou de seus fornecedores de conteúdo e protegido pelas leis de direitos autorais internacionais e brasileiras.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[#234b61] mb-3">6. Limitação de Responsabilidade</h2>
          <p>
            A RegulaBio não será responsável por quaisquer danos diretos, indiretos, incidentais, especiais ou consequenciais resultantes do uso ou da incapacidade de usar nossos serviços, incluindo, mas não se limitando a, danos por perda de lucros, uso, dados ou outras perdas intangíveis.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[#234b61] mb-3">7. Modificações dos Termos</h2>
          <p>
            Reservamo-nos o direito de modificar estes Termos de Uso a qualquer momento. As alterações entrarão em vigor imediatamente após a publicação no site. O uso contínuo dos serviços após tais modificações constitui sua aceitação dos novos termos.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[#234b61] mb-3">8. Foro e Legislação Aplicável</h2>
          <p>
            Estes Termos de Uso são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da comarca da sede da RegulaBio para dirimir quaisquer controvérsias oriundas destes termos, com renúncia expressa a qualquer outro, por mais privilegiado que seja.
          </p>
        </section>
      </div>
    </div>
  );
}
