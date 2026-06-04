import React from 'react';
import {render, screen} from '@testing-library/react';
import '@testing-library/jest-dom';
import Maintenance from './Maintenance';
import {useAppSelector} from '@/utils/hooks';

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({
              src,
              alt,
              ...props
            }: {
    src: string | { src: string };
    alt: string;
  } & Omit<React.ComponentProps<'img'>, 'src' | 'alt'>) => {
    const resolvedSrc = typeof src === 'string' ? src : src.src;
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={resolvedSrc} alt={alt} {...props} />;
  },
}));

jest.mock('@/utils/hooks', () => ({
  useAppSelector: jest.fn(),
   
  useLanguage: () => ({ language: 'fr', setLanguage: jest.fn(), t: jest.requireActual('@/translations').translations.fr }),
}));

const mockedUseAppSelector = useAppSelector as jest.MockedFunction<typeof useAppSelector>;

describe('Maintenance', () => {
  it('renders nothing when maintenance is disabled', () => {
    mockedUseAppSelector.mockReturnValue(false);

    const {container} = render(<Maintenance/>);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the maintenance page when maintenance is enabled', () => {
    mockedUseAppSelector.mockReturnValue(true);

    render(<Maintenance/>);

    expect(screen.getByTestId('maintenance-gate')).toBeInTheDocument();
    expect(screen.getByText('Maintenance en cours')).toBeInTheDocument();
    expect(screen.getByText(/Nous effectuons actuellement une maintenance sur l'application/i)).toBeInTheDocument();
  });
});
