// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface IBatteryDashboardProps {
  description: string;
  isDarkTheme: boolean;
  environmentMessage: string;
  userDisplayName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: any; // WebPartContext — necessário para foto do usuário
}
