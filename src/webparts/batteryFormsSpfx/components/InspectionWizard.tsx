import * as React from 'react';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import styles from './BatteryFormsSpfx.module.scss';
import {
  IWizardFormData,
  DEFAULT_WIZARD_DATA,
  WIZARD_STEPS,
} from '../../../models/BatteryInspection';
import { CoverPage } from './CoverPage';
import { ActivityInfoPage } from './ActivityInfoPage';
import { ContactPage } from './ContactPage';
import { IntegrityPage } from './IntegrityPage';
import { ParametersPage } from './ParametersPage';
import { OperationalPage } from './OperationalPage';
import { VerificationPage } from './VerificationPage';
import { ExitCheckPage } from './ExitCheckPage';
import { SummaryPage } from './SummaryPage';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const logoVale = require('../../../../images/logo-vale-escudo-2048.png');

export interface IInspectionWizardProps {
  context: WebPartContext;
}

export const InspectionWizard: React.FC<IInspectionWizardProps> = () => {
  const [currentStep, setCurrentStep] = React.useState<number>(0);
  const [formData, setFormData] = React.useState<IWizardFormData>(
    DEFAULT_WIZARD_DATA
  );

  // ── Navegação ───────────────────────────────────────────────────────

  const handleNext = (pageData?: Partial<IWizardFormData>): void => {
    if (pageData) {
      setFormData((prev) => ({ ...prev, ...pageData }));
    }
    setCurrentStep((prev) =>
      Math.min(prev + 1, WIZARD_STEPS.length - 1)
    );
  };

  const handlePrevious = (pageData?: Partial<IWizardFormData>): void => {
    if (pageData) {
      setFormData((prev) => ({ ...prev, ...pageData }));
    }
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  // ── Progresso ───────────────────────────────────────────────────────

  const totalSteps = WIZARD_STEPS.length - 1; // Exclui a capa do cálculo
  const progress =
    currentStep === 0
      ? 0
      : (currentStep / totalSteps) * 100;

  // ── Render da página atual ──────────────────────────────────────────

  const renderPage = (): React.ReactNode => {
    switch (currentStep) {
      case 0:
        return <CoverPage onNext={handleNext} />;
      case 1:
        return (
          <ActivityInfoPage
            data={formData}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 2:
        return (
          <ContactPage
            data={formData}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 3:
        return (
          <IntegrityPage
            data={formData}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 4:
        return (
          <ParametersPage
            onNext={() => handleNext()}
            onPrevious={() => handlePrevious()}
          />
        );
      case 5:
        return (
          <OperationalPage
            data={formData}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 6:
        return (
          <VerificationPage
            data={formData}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 7:
        return (
          <ExitCheckPage
            data={formData}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 8:
        return (
          <SummaryPage
            data={formData}
            onPrevious={handlePrevious}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.wizardContainer}>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <header className={styles.wizardHeader}>
        <div className={styles.headerContent}>
          <img
            src={logoVale}
            alt="Vale"
            className={styles.headerLogo}
          />
          <h1 className={styles.headerTitle}>
            RG 1107 — Inspeção de Baterias
          </h1>
        </div>
        {currentStep > 0 && (
          <div className={styles.progressBarContainer}>
            <div
              className={styles.progressBar}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </header>

      {/* ── Stepper (oculto na capa) ────────────────────────────────── */}
      {currentStep > 0 && (
        <nav className={styles.stepper}>
          {WIZARD_STEPS.slice(1).map((step, index) => {
            const stepNumber = index + 1;
            const isActive = currentStep === stepNumber;
            const isCompleted = currentStep > stepNumber;

            return (
              <div
                key={stepNumber}
                className={[
                  styles.stepperItem,
                  isActive ? styles.stepperItemActive : '',
                  isCompleted ? styles.stepperItemCompleted : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <div className={styles.stepperCircle}>
                  {isCompleted ? '✓' : stepNumber}
                </div>
                <span className={styles.stepperLabel}>
                  {step.shortLabel}
                </span>
              </div>
            );
          })}
        </nav>
      )}

      {/* ── Conteúdo da Página ───────────────────────────────────────── */}
      <main className={styles.pageContent}>
        {renderPage()}
      </main>
    </div>
  );
};