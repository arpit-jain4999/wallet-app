/**
 * Tests for Typography component
 */
import { render, screen } from '@testing-library/react';
import { Typography } from '../typography';

describe('Typography Component', () => {
  it('should render with default variant', () => {
    render(<Typography>Default text</Typography>);
    
    const element = screen.getByText('Default text');
    expect(element).toBeInTheDocument();
    expect(element.tagName).toBe('P');
  });

  it('should render h1 variant', () => {
    render(<Typography variant="h1">Heading 1</Typography>);
    
    const element = screen.getByText('Heading 1');
    expect(element.tagName).toBe('H1');
  });

  it('should render h2 variant', () => {
    render(<Typography variant="h2">Heading 2</Typography>);
    
    const element = screen.getByText('Heading 2');
    expect(element.tagName).toBe('H2');
  });

  it('should render h3 variant', () => {
    render(<Typography variant="h3">Heading 3</Typography>);
    
    const element = screen.getByText('Heading 3');
    expect(element.tagName).toBe('H3');
  });

  it('should render h4 variant', () => {
    render(<Typography variant="h4">Heading 4</Typography>);
    
    const element = screen.getByText('Heading 4');
    expect(element.tagName).toBe('H4');
  });

  it('should render body text', () => {
    render(<Typography variant="body">Body text</Typography>);
    
    const element = screen.getByText('Body text');
    expect(element).toBeInTheDocument();
  });

  it('should render small text', () => {
    render(<Typography variant="small">Small text</Typography>);
    
    const element = screen.getByText('Small text');
    expect(element).toBeInTheDocument();
  });

  it('should render muted text', () => {
    render(<Typography variant="muted">Muted text</Typography>);
    
    const element = screen.getByText('Muted text');
    expect(element).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<Typography className="custom-class">Text</Typography>);
    
    const element = screen.getByText('Text');
    expect(element).toHaveClass('custom-class');
  });

  it('should render children correctly', () => {
    render(
      <Typography>
        <span>Child content</span>
      </Typography>
    );
    
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });
});
