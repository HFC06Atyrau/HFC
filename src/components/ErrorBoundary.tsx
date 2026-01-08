import { Component, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary для отлова ошибок в компонентах
 * Предотвращает падение всего приложения
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null 
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true,
      error 
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full space-y-6 text-center">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-destructive/20 rounded-full flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-destructive" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-display font-bold text-foreground">
                Что-то пошло не так
              </h1>
              <p className="text-muted-foreground">
                Произошла непредвиденная ошибка. Попробуйте перезагрузить страницу.
              </p>
            </div>

            {this.state.error && (
              <details className="text-left bg-secondary p-4 rounded-lg">
                <summary className="cursor-pointer text-sm font-medium mb-2">
                  Детали ошибки
                </summary>
                <pre className="text-xs text-muted-foreground overflow-auto max-h-40">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}

            <Button 
              onClick={this.handleReset}
              className="w-full"
            >
              Перезагрузить страницу
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
