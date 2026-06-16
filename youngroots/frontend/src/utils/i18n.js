/**
 * YoungRoots — i18n Configuration
 * Supports English, Swahili, French, Portuguese
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      nav: {
        home: 'Home', services: 'Services', aiGuide: 'AI Guide',
        report: 'Report', cases: 'My Cases', dashboard: 'Insights', admin: 'Admin',
      },
      hero: {
        title: 'Your health. Your rights. Your choice.',
        subtitle: 'A safe, private space for young people to access sexual and reproductive health services, ask questions, and get support — anonymously.',
        findServices: 'Find Services Near Me',
        askAI: 'Ask the AI Guide',
        reportAnon: 'Report Anonymously',
      },
      ai: {
        greeting: "Hi! I'm Yara, your private sexual and reproductive health guide. 💚\n\nYou can ask me anything. Everything stays anonymous.",
        placeholder: 'Type your question anonymously...',
        send: 'Send',
        privacyNote: 'This conversation is anonymous and not linked to your identity.',
      },
      report: {
        title: 'Anonymous Rights Reporting',
        subtitle: 'Report safely. No personal information is required.',
        submit: 'Submit Anonymously',
        successTitle: 'Report Submitted Safely',
        saveId: 'Save this case ID to follow up.',
      },
      common: {
        anonymous: 'Anonymous',
        loading: 'Loading...',
        back: 'Back',
        close: 'Close',
        free: 'Free',
        open: 'Open Now',
        closed: 'Closed',
      },
    },
  },
  sw: {
    translation: {
      nav: {
        home: 'Nyumbani', services: 'Huduma', aiGuide: 'Msaidizi wa AI',
        report: 'Ripoti', cases: 'Kesi Zangu', dashboard: 'Takwimu', admin: 'Msimamizi',
      },
      hero: {
        title: 'Afya yako. Haki zako. Chaguo lako.',
        subtitle: 'Nafasi salama na ya faragha kwa vijana kupata huduma za afya ya uzazi, kuuliza maswali, na kupata msaada — bila kutambulika.',
        findServices: 'Pata Huduma Karibu Nawe',
        askAI: 'Uliza Msaidizi wa AI',
        reportAnon: 'Ripoti bila Kutambulika',
      },
      ai: {
        greeting: 'Habari! Mimi ni Yara, mshauri wako wa afya ya ngono na uzazi. 💚\n\nUnaweza kuniuliza chochote. Kila kitu kinabaki siri.',
        placeholder: 'Andika swali lako bila kutambulika...',
        send: 'Tuma',
        privacyNote: 'Mazungumzo haya yanabaki siri na hayahusiani na utambulisho wako.',
      },
      report: {
        title: 'Ripoti ya Haki bila Kutambulika',
        subtitle: 'Ripoti kwa usalama. Hakuna taarifa za kibinafsi zinazohitajika.',
        submit: 'Wasilisha bila Kutambulika',
        successTitle: 'Ripoti Imewasilishwa kwa Usalama',
        saveId: 'Hifadhi nambari hii ya kesi kufuatilia.',
      },
      common: {
        anonymous: 'Bila Kutambulika',
        loading: 'Inapakia...',
        back: 'Rudi',
        close: 'Funga',
        free: 'Bure',
        open: 'Wazi Sasa',
        closed: 'Imefungwa',
      },
    },
  },
  fr: {
    translation: {
      nav: {
        home: 'Accueil', services: 'Services', aiGuide: 'Guide IA',
        report: 'Signaler', cases: 'Mes Dossiers', dashboard: 'Tableau de bord', admin: 'Admin',
      },
      hero: {
        title: 'Ta santé. Tes droits. Ton choix.',
        subtitle: 'Un espace sûr et privé pour les jeunes pour accéder aux services de santé sexuelle et reproductive, poser des questions — anonymement.',
        findServices: 'Trouver des Services',
        askAI: 'Demander au Guide IA',
        reportAnon: 'Signaler Anonymement',
      },
      common: { anonymous: 'Anonyme', loading: 'Chargement...', free: 'Gratuit' },
    },
  },
  pt: {
    translation: {
      nav: {
        home: 'Início', services: 'Serviços', aiGuide: 'Guia IA',
        report: 'Denunciar', cases: 'Meus Casos', dashboard: 'Painel', admin: 'Admin',
      },
      hero: {
        title: 'Sua saúde. Seus direitos. Sua escolha.',
        subtitle: 'Um espaço seguro e privado para jovens acessarem serviços de saúde sexual e reprodutiva — anonimamente.',
        findServices: 'Encontrar Serviços',
        askAI: 'Perguntar ao Guia IA',
        reportAnon: 'Denunciar Anonimamente',
      },
      common: { anonymous: 'Anônimo', loading: 'Carregando...', free: 'Gratuito' },
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng:      localStorage.getItem('youngroots_lang') || 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
