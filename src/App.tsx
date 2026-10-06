import { ProjectShell } from './shell';
import { ThemeProvider } from './theme';

export function App() {
  return (
    <ThemeProvider>
      <ProjectShell />
    </ThemeProvider>
  );
}
