import { successTemplate } from './success.js';
import { errorTemplate } from './error.js';
import { warningTemplate } from './warning.js';
import { infoTemplate } from './info.js';
import { buildTemplate } from './build.js';
import { deployTemplate } from './deploy.js';
import { testTemplate } from './test.js';
import { backupTemplate } from './backup.js';

export const NOTIFICATION_TEMPLATES = {
  success: successTemplate,
  error: errorTemplate,
  warning: warningTemplate,
  info: infoTemplate,
  build: buildTemplate,
  deploy: deployTemplate,
  test: testTemplate,
  backup: backupTemplate
};

export type TemplateType = keyof typeof NOTIFICATION_TEMPLATES;

export interface NotificationTemplate {
  title: string;
  message: string;
  urgency: string;
  timeout: number;
  icon: string;
  sound: string;
}