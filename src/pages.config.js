/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AboutUs from './pages/AboutUs';
import AddMilestone from './pages/AddMilestone';
import AddTrustee from './pages/AddTrustee';
import AppSettings from './pages/AppSettings';
import CapsuleDetail from './pages/CapsuleDetail';
import ChangeEmail from './pages/ChangeEmail';
import ChangePassword from './pages/ChangePassword';
import ChapterDetail from './pages/ChapterDetail';
import Chapters from './pages/Chapters';
import CircleDetail from './pages/CircleDetail';
import Circles from './pages/Circles';
import CreateAccount from './pages/CreateAccount';
import CreateCapsule from './pages/CreateCapsule';
import CreateChapter from './pages/CreateChapter';
import CreateCircle from './pages/CreateCircle';
import CreateEntry from './pages/CreateEntry';
import EditProfile from './pages/EditProfile';
import EmailVerify from './pages/EmailVerify';
import EntryDetail from './pages/EntryDetail';
import Home from './pages/Home';
import LanguageSelect from './pages/LanguageSelect';
import MemorialSettings from './pages/MemorialSettings';
import MilestoneDetail from './pages/MilestoneDetail';
import Milestones from './pages/Milestones';
import NotificationSettings from './pages/NotificationSettings';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Profile from './pages/Profile';
import Splash from './pages/Splash';
import Subscription from './pages/Subscription';
import TermsConditions from './pages/TermsConditions';
import TrusteeDetail from './pages/TrusteeDetail';
import Paywall from './pages/Paywall';


export const PAGES = {
    "AboutUs": AboutUs,
    "AddMilestone": AddMilestone,
    "AddTrustee": AddTrustee,
    "AppSettings": AppSettings,
    "CapsuleDetail": CapsuleDetail,
    "ChangeEmail": ChangeEmail,
    "ChangePassword": ChangePassword,
    "ChapterDetail": ChapterDetail,
    "Chapters": Chapters,
    "CircleDetail": CircleDetail,
    "Circles": Circles,
    "CreateAccount": CreateAccount,
    "CreateCapsule": CreateCapsule,
    "CreateChapter": CreateChapter,
    "CreateCircle": CreateCircle,
    "CreateEntry": CreateEntry,
    "EditProfile": EditProfile,
    "EmailVerify": EmailVerify,
    "EntryDetail": EntryDetail,
    "Home": Home,
    "LanguageSelect": LanguageSelect,
    "MemorialSettings": MemorialSettings,
    "MilestoneDetail": MilestoneDetail,
    "Milestones": Milestones,
    "NotificationSettings": NotificationSettings,
    "PrivacyPolicy": PrivacyPolicy,
    "Profile": Profile,
    "Splash": Splash,
    "Subscription": Subscription,
    "TermsConditions": TermsConditions,
    "TrusteeDetail": TrusteeDetail,
    "Paywall": Paywall,
}

export const pagesConfig = {
    mainPage: "LanguageSelect",
    Pages: PAGES,
};