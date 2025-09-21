import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import ContentFilters from '../../../components/content/ContentFilters';
import { useAppStore } from '../../../stores/app-store';

// Mock the store
vi.mock('../../../stores/app-store');

// Helper to wrap component with Router
const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

// Mock the store
vi.mock('../../../stores/app-store');

const mockSetFilters = vi.fn();
const mockStore = {
  content: {
    filters: {
      mediaTypes: ['image', 'video', 'gif'],
      showNSFW: false,
      minScore: 10,
      keywords: [],
      excludeKeywords: [],
      preset: '',
      quality: {
        enabled: false,
        threshold: 50,
      },
    },
  },
  setFilters: mockSetFilters,
};

describe('ContentFilters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAppStore as any).mockReturnValue(mockStore);
  });

  it('should render content filters component', () => {
    renderWithRouter(<ContentFilters />);

    expect(screen.getAllByText('Content Filters')).toHaveLength(2); // Navigation title + main title
    expect(screen.getByText('Media Types')).toBeInTheDocument();
    expect(screen.getByText('Content Quality')).toBeInTheDocument();
  });

  it('should display all media type toggles', () => {
    renderWithRouter(<ContentFilters />);

    expect(screen.getByText('Images')).toBeInTheDocument();
    expect(screen.getByText('Videos')).toBeInTheDocument();
    expect(screen.getByText('GIFs')).toBeInTheDocument();
  });

  it('should toggle media types when clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ContentFilters />);

    const imageToggle = screen.getByText('Images').closest('button');
    expect(imageToggle).toBeInTheDocument();

    await user.click(imageToggle!);

    expect(mockSetFilters).toHaveBeenCalledWith({
      mediaTypes: ['video', 'gif'],
    });
  });

  it('should display NSFW checkbox', () => {
    renderWithRouter(<ContentFilters />);

    expect(screen.getByText('Show NSFW content')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('should toggle NSFW setting when clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ContentFilters />);

    const nsfwCheckbox = screen.getByRole('checkbox');
    await user.click(nsfwCheckbox);

    expect(mockSetFilters).toHaveBeenCalledWith({
      showNSFW: true,
    });
  });

  it('should display score threshold slider', () => {
    renderWithRouter(<ContentFilters />);

    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  it('should display quick presets', () => {
    renderWithRouter(<ContentFilters />);

    expect(screen.getByText('Quick Presets')).toBeInTheDocument();
    expect(screen.getByText('All Content')).toBeInTheDocument();
    expect(screen.getByText('Images Only')).toBeInTheDocument();
    expect(screen.getByText('High Quality')).toBeInTheDocument();
    expect(screen.getByText('Safe Content')).toBeInTheDocument();
  });

  it('should apply preset when clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ContentFilters />);

    const imagesOnlyPreset = screen.getByText('Images Only').closest('button');
    await user.click(imagesOnlyPreset!);

    expect(mockSetFilters).toHaveBeenCalledWith({
      mediaTypes: ['image'],
      showNSFW: false,
      minScore: 0,
    });
  });

  it('should show advanced filters when toggled', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ContentFilters />);

    const advancedToggle = screen.getByTitle('Advanced Filters');
    await user.click(advancedToggle);

    expect(screen.getByText('Advanced Filters')).toBeInTheDocument();
    expect(screen.getByText('Keywords (comma-separated)')).toBeInTheDocument();
  });

  it('should clear all filters when reset button is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ContentFilters />);

    const resetButton = screen.getByText('Clear All Filters');
    await user.click(resetButton);

    expect(mockSetFilters).toHaveBeenCalledWith({
      mediaTypes: ['image', 'video', 'gif'],
      showNSFW: false,
      minScore: 0,
    });
  });

  it('should handle custom CSS class', () => {
    const { container } = renderWithRouter(
      <ContentFilters className='custom-class' />
    );

    // The custom class is applied to the main content div, not the page wrapper
    const customElement = container.querySelector('.custom-class');
    expect(customElement).toBeInTheDocument();
  });

  it('should display active keyword tags when keywords exist', () => {
    const storeWithKeywords = {
      ...mockStore,
      content: {
        ...mockStore.content,
        filters: {
          ...mockStore.content.filters,
          keywords: ['nature', 'landscape'],
        },
      },
    };

    (useAppStore as any).mockReturnValue(storeWithKeywords);
    renderWithRouter(<ContentFilters />);

    // Open advanced filters to see keywords
    const advancedToggle = screen.getByTitle('Advanced Filters');
    fireEvent.click(advancedToggle);

    expect(screen.getByText('nature')).toBeInTheDocument();
    expect(screen.getByText('landscape')).toBeInTheDocument();
  });

  it('should add keywords when apply button is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ContentFilters />);

    // Open advanced filters first
    const advancedToggle = screen.getByTitle('Advanced Filters');
    await user.click(advancedToggle);

    const keywordInput = screen.getByPlaceholderText(
      /nature, landscape, technology/i
    );
    await user.type(keywordInput, 'nature,landscape');

    const applyButton = screen.getByText('Apply');
    await user.click(applyButton);

    expect(mockSetFilters).toHaveBeenCalledWith({
      keywords: ['nature', 'landscape'],
      excludeKeywords: [],
      preset: '',
      quality: {
        enabled: false,
        threshold: 50,
      },
      mediaTypes: ['image', 'video', 'gif'],
      showNSFW: false,
      minScore: 10,
    });
  });
});
