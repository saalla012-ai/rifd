import type { ComponentType } from 'react'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

import { template as subscriptionActivated } from './subscription-activated'
import { template as subscriptionExpiring } from './subscription-expiring'
import { template as welcome } from './welcome'
import { template as onboardingDay1 } from './onboarding-day1'
import { template as onboardingTipDay3 } from './onboarding-tip-day3'
import { template as onboardingDay5 } from './onboarding-day5'
import { template as onboardingDay7 } from './onboarding-day7'

/**
 * Template registry — maps template names to their React Email components.
 * Import and register new templates here after creating them in this directory.
 */
export const TEMPLATES: Record<string, TemplateEntry> = {
  'subscription-activated': subscriptionActivated,
  'subscription-expiring': subscriptionExpiring,
  'welcome': welcome,
  'onboarding-day1': onboardingDay1,
  'onboarding-tip-day3': onboardingTipDay3,
  'onboarding-day5': onboardingDay5,
  'onboarding-day7': onboardingDay7,
}
