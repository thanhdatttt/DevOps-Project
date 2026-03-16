import React from 'react';
import { render, screen } from '@testing-library/react';
import BreadcrumbComponent from 'common/components/BreadcrumbComponent';
import { BreadcrumbModel } from 'modules/breadcrumb/model/BreadcrumbModel';

jest.mock('react-bootstrap/Breadcrumb', () => {
  const MockBreadcrumb = ({ children, className }: any) => (
    <nav className={className}>{children}</nav>
  );
  MockBreadcrumb.Item = ({ href, active, children }: any) => (
    <a href={href} aria-current={active ? 'page' : undefined}>
      {children}
    </a>
  );
  MockBreadcrumb.displayName = 'Breadcrumb';
  return MockBreadcrumb;
});

const pages: BreadcrumbModel[] = [
  { pageName: 'Home', url: '/' },
  { pageName: 'Products', url: '/products' },
  { pageName: 'Laptop', url: '/products/laptop' },
];

describe('BreadcrumbComponent', () => {
  it('renders all breadcrumb items', () => {
    render(<BreadcrumbComponent props={pages} />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getByText('Laptop')).toBeInTheDocument();
  });

  it('renders correct hrefs', () => {
    render(<BreadcrumbComponent props={pages} />);
    expect(screen.getByText('Home').closest('a')).toHaveAttribute('href', '/');
    expect(screen.getByText('Products').closest('a')).toHaveAttribute('href', '/products');
  });

  it('marks only last item as active', () => {
    render(<BreadcrumbComponent props={pages} />);
    const lastItem = screen.getByText('Laptop').closest('a');
    expect(lastItem).toHaveAttribute('aria-current', 'page');
  });

  it('does not mark first item as active', () => {
    render(<BreadcrumbComponent props={pages} />);
    const firstItem = screen.getByText('Home').closest('a');
    expect(firstItem).not.toHaveAttribute('aria-current', 'page');
  });

  it('renders a single breadcrumb item correctly', () => {
    render(<BreadcrumbComponent props={[{ pageName: 'Home', url: '/' }]} />);
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('renders empty list without errors', () => {
    const { container } = render(<BreadcrumbComponent props={[]} />);
    expect(container).toBeInTheDocument();
  });
});
