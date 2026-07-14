/* oxlint-disable */
/* eslint-disable */
/// <reference types="@quasar/app-vite" />
/// <reference types="@quasar/app-vite/client" />

// https://quasar.dev/quasar-cli-vite/handling-import-meta-env#type-inference

// Automatically generated from raw build.define
declare const __VUE_PROD_DEVTOOLS__: boolean;
declare const __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: boolean;
declare const __VUE_I18N_FULL_INSTALL__: boolean;
declare const __VUE_I18N_LEGACY_API__: boolean;
declare const __VUE_I18N_PROD_DEVTOOLS__: boolean;
declare const __INTLIFY_PROD_DEVTOOLS__: boolean;
declare const __VUE_OPTIONS_API__: boolean;

// Automatically generated from process.env & dotenv files & build.define & build.defineEnv;
// Backend-only are not available in client code, so they are marked as optional
interface ImportMetaEnv {
  readonly ALLUSERSPROFILE?: string;
  readonly AMI_HOST?: string;
  readonly AMI_SERVICE?: number;
  readonly APPDATA?: string;
  readonly CHROME_CRASHPAD_PIPE_NAME?: string;
  readonly CommonProgramFiles?: string;
  readonly CommonProgramW6432?: string;
  readonly COMPUTERNAME?: string;
  readonly ComSpec?: string;
  readonly DriverData?: string;
  readonly FPS_BROWSER_APP_PROFILE_STRING?: string;
  readonly FPS_BROWSER_USER_PROFILE_STRING?: string;
  readonly FP_NO_HOST_CHECK?: string;
  readonly HOME?: string;
  readonly HOMEDRIVE?: string;
  readonly HOMEPATH?: string;
  readonly LOCALAPPDATA?: string;
  readonly LOGONSERVER?: string;
  readonly NODE_ENV?: string;
  readonly NUMBER_OF_PROCESSORS?: number;
  readonly OneDrive?: string;
  readonly ORIGINAL_XDG_CURRENT_DESKTOP?: string;
  readonly OS?: string;
  readonly Path?: string;
  readonly PATHEXT?: string;
  readonly PROCESSOR_ARCHITECTURE?: string;
  readonly PROCESSOR_IDENTIFIER?: string;
  readonly PROCESSOR_LEVEL?: number;
  readonly PROCESSOR_REVISION?: string;
  readonly PROG27B48B2C052?: number;
  readonly ProgramData?: string;
  readonly ProgramFiles?: string;
  readonly ProgramW6432?: string;
  readonly PROMPT?: string;
  readonly PSModulePath?: string;
  readonly PUBLIC?: string;
  readonly QUASAR_CLI_VERSION?: string;
  readonly SESSIONNAME?: string;
  readonly SystemDrive?: string;
  readonly SystemRoot?: string;
  readonly TEMP?: string;
  readonly TMP?: string;
  readonly USERDOMAIN?: string;
  readonly USERDOMAIN_ROAMINGPROFILE?: string;
  readonly USERNAME?: string;
  readonly USERPROFILE?: string;
  readonly VBOX_MSI_INSTALL_PATH?: string;
  readonly windir?: string;
  readonly WINDROYEBOX_CFPATH?: string;
  readonly ZES_ENABLE_SYSMAN?: number;
  readonly __PSLockDownPolicy?: number;
  readonly TERM_PROGRAM?: string;
  readonly TERM_PROGRAM_VERSION?: string;
  readonly LANG?: string;
  readonly COLORTERM?: string;
  readonly GIT_ASKPASS?: string;
  readonly VSCODE_GIT_ASKPASS_NODE?: string;
  readonly VSCODE_GIT_ASKPASS_EXTRA_ARGS?: string;
  readonly VSCODE_GIT_ASKPASS_MAIN?: string;
  readonly VSCODE_GIT_IPC_HANDLE?: string;
  readonly VITE_API_URL?: string;
}
