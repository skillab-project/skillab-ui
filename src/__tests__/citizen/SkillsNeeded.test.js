import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import SkillsNeeded from '../../views/citizen/SkillsNeeded';


jest.mock('reactstrap', () => {
    const original = jest.requireActual('reactstrap');
    return {
        ...original,
        Table: ({ children, ...props }) => <table {...props}>{children}</table>,
        Pagination: ({ children, ...props }) => <nav role="navigation" {...props}><ul>{children}</ul></nav>,
        PaginationItem: ({ children, active, disabled, ...props }) => {
            const classNames = [];
            if (active) classNames.push('active');
            if (disabled) classNames.push('disabled');
            // Ensure className is a string, even if empty
            return <li className={classNames.join(' ') || undefined} {...props}>{children}</li>;
        },
        PaginationLink: ({ children, previous, next, onClick, ...props }) => {
            let ariaLabel = props['aria-label'];
            if (!ariaLabel) {
                if (previous) ariaLabel = 'Previous page';
                if (next) ariaLabel = 'Next page';
                // For page numbers, children will be the name
            }

            // Add an href to make it a link
            // onClick is also important for userEvent to work correctly with links
            return (
                <a
                    href="#"
                    onClick={(e) => {
                        e.preventDefault();
                        if (onClick) {
                            onClick(e);
                        }
                    }}
                    aria-label={ariaLabel} // Will be undefined if not prev/next, allowing children to be name
                    {...props}
                >
                    {children}
                </a>
            );
        },
        Row: ({ children, ...props }) => <div {...props}>{children}</div>,
        Col: ({ children, ...props }) => <div {...props}>{children}</div>,
        CustomInput: ({ checked, onChange, id, ...props }) => (
            <input type="checkbox" role="switch" id={id} checked={checked} onChange={onChange} {...props} />
        ),
    };
});


const mockData = [
    { Skills: 'React', Pillar: 'K', Value: 0.9 },
    { Skills: 'JavaScript', Pillar: 'K', Value: 0.85 },
    { Skills: 'CSS', Pillar: 'T', Value: 0.7 },
    { Skills: 'Node.js', Pillar: 'S', Value: 0.75 },
    { Skills: 'English', Pillar: 'L', Value: 0.95 },
    { Skills: 'Python', Pillar: 'K', Value: 0.6 },
    { Skills: 'Agile', Pillar: 'T', Value: 0.8 },
    { Skills: 'SQL', Pillar: 'S', Value: 0.65 },
    { Skills: 'German', Pillar: 'L', Value: 0.5 },
    { Skills: 'Project Management', Pillar: 'T', Value: 0.7 },
    { Skills: 'AWS', Pillar: 'K', Value: 0.55 },
    { Skills: 'Docker', Pillar: 'S', Value: 0.5 }
];

const mockUserSkills = [
    { skill: { label: 'React' }, years: 5 },
    { skill: { label: 'JavaScript' }, years: 7 },
    { skill: { label: 'CSS' }, years: 3 },
    { skill: { label: 'english' }, years: 15 },
];

const mockOnSelectSkill = jest.fn();

describe('SkillsNeeded Component', () => {
    beforeEach(() => {
        // Reset mocks before each test
        mockOnSelectSkill.mockClear();
    });



    test('renders correctly with initial data', () => {
        render(<SkillsNeeded data={mockData.slice(0, 3)} skills={mockUserSkills} onSelectSkill={mockOnSelectSkill} />);

        // Check for headers
        expect(screen.getByText('Skill')).toBeInTheDocument();
        expect(screen.getByText('Pillar')).toBeInTheDocument();
        expect(screen.getByText('Importance')).toBeInTheDocument();
        expect(screen.getByText('Re/Upskilling')).toBeInTheDocument();

        // Check for toggle
        expect(screen.getByText('Only My Skills')).toBeInTheDocument();
        expect(screen.getByRole('switch')).toBeInTheDocument();

        // Check for some data
        expect(screen.getByText('React')).toBeInTheDocument();
        expect(screen.getByText('JavaScript')).toBeInTheDocument();
        expect(screen.getByText('CSS')).toBeInTheDocument();
    });



    test('maps pillar codes to full names', () => {
        const testData = [{ Skills: 'Test Skill', Pillar: 'K', Value: 0.5 }];
        render(<SkillsNeeded data={testData} skills={[]} onSelectSkill={mockOnSelectSkill} />);
        expect(screen.getByText('Knowledge')).toBeInTheDocument(); // K -> Knowledge
    });



    test('formats importance value correctly', () => {
        const testData = [{ Skills: 'Test Skill', Pillar: 'K', Value: 0.888 }];
        render(<SkillsNeeded data={testData} skills={[]} onSelectSkill={mockOnSelectSkill} />);
        expect(screen.getByText('88.8%')).toBeInTheDocument();
    });



    test('displays a dot with years for user-owned skills', () => {
        render(<SkillsNeeded data={mockData.slice(0, 1)} skills={mockUserSkills} onSelectSkill={mockOnSelectSkill} />); // Data has 'React'
        
        const reactSkillCell = screen.getByText('React').closest('td');
        expect(reactSkillCell).toBeInTheDocument();

        // The dot is a span with specific style and title
        const dot = reactSkillCell.querySelector('span[style*="background-color"]');
        expect(dot).toBeInTheDocument();
        expect(dot).toHaveAttribute('title', '5 years'); // React -> 5 years
    });



    test('does not display a dot for skills not owned by user', () => {
        render(<SkillsNeeded data={[{ Skills: 'Python', Pillar: 'K', Value: 0.6 }]} skills={mockUserSkills} onSelectSkill={mockOnSelectSkill} />);
        
        const pythonSkillCell = screen.getByText('Python').closest('td');
        expect(pythonSkillCell).toBeInTheDocument();
        const dot = pythonSkillCell.querySelector('span[style*="background-color"]');
        expect(dot).not.toBeInTheDocument();
    });



    test('handles "Only My Skills" toggle correctly', async () => {
        render(<SkillsNeeded data={mockData} skills={mockUserSkills} onSelectSkill={mockOnSelectSkill} />);
        const toggle = screen.getByRole('switch');

        // Initially, all skills should be visible (or first page of them)
        expect(screen.getByText('React')).toBeInTheDocument(); // User skill
        expect(screen.getByText('Node.js')).toBeInTheDocument(); // Non-user skill

        // Toggle on "Only My Skills"
        await userEvent.click(toggle);

        expect(screen.getByText('React')).toBeInTheDocument();
        expect(screen.getByText('JavaScript')).toBeInTheDocument();
        expect(screen.getByText('CSS')).toBeInTheDocument();
        expect(screen.getByText('English')).toBeInTheDocument();

        // Toggle off "Only My Skills"
        await userEvent.click(toggle);
        expect(screen.getByText('React')).toBeInTheDocument();
        expect(screen.getByText('Node.js')).toBeInTheDocument();
    });



    test('pagination appears when there are more than 10 items', () => {
        render(<SkillsNeeded data={mockData} skills={[]} onSelectSkill={mockOnSelectSkill} />); // 12 items
        expect(screen.getByRole('navigation')).toBeInTheDocument(); // Pagination uses nav landmark
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
    });



    test('pagination does not appear when there are 10 or fewer items', () => {
        render(<SkillsNeeded data={mockData.slice(0, 10)} skills={[]} onSelectSkill={mockOnSelectSkill} />);
        expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });



    test('pagination changes pages correctly', async () => {
        render(<SkillsNeeded data={mockData} skills={[]} onSelectSkill={mockOnSelectSkill} />); // 12 items

        // Initially on page 1
        expect(screen.getByText(mockData[0].Skills)).toBeInTheDocument(); // React
        expect(screen.queryByText(mockData[10].Skills)).not.toBeInTheDocument(); // AWS (11th item)

        // Go to page 2
        const page2Button = screen.getByRole('link', { name: '2' }); // Or getByText('2') if it's unique
        await userEvent.click(page2Button);

        expect(screen.queryByText(mockData[0].Skills)).not.toBeInTheDocument();
        expect(screen.getByText(mockData[10].Skills)).toBeInTheDocument(); // AWS
        expect(screen.getByText(mockData[11].Skills)).toBeInTheDocument(); // Docker

        // Go back to page 1 using "Previous"
        const prevButton = screen.getByRole('link', { name: /previous/i });
        await userEvent.click(prevButton);
        expect(screen.getByText(mockData[0].Skills)).toBeInTheDocument();
    });



    test('pagination "Next" and "Previous" buttons are disabled appropriately', async () => {
        render(<SkillsNeeded data={mockData} skills={[]} onSelectSkill={mockOnSelectSkill} />); // 12 items, 2 pages

        const prevButton = screen.getByRole('link', { name: /previous/i }).closest('li');
        const nextButton = screen.getByRole('link', { name: /next/i }).closest('li');

        // On page 1
        expect(prevButton).toHaveClass('disabled');
        expect(nextButton).not.toHaveClass('disabled');

        // Go to page 2
        await userEvent.click(screen.getByRole('link', { name: '2' }));
        
        expect(prevButton).not.toHaveClass('disabled');
        expect(nextButton).toHaveClass('disabled');
    });



    test('resets to page 1 when "Only My Skills" toggle changes', async () => {
        const longData = [
            ...mockData, // 12 items
            { Skills: 'Skill 13', Pillar: 'K', Value: 0.1 }, { Skills: 'Skill 14', Pillar: 'K', Value: 0.1 },
            { Skills: 'Skill 15', Pillar: 'K', Value: 0.1 }, { Skills: 'Skill 16', Pillar: 'K', Value: 0.1 },
            { Skills: 'Skill 17', Pillar: 'K', Value: 0.1 }, { Skills: 'Skill 18', Pillar: 'K', Value: 0.1 },
            { Skills: 'Skill 19', Pillar: 'K', Value: 0.1 }, { Skills: 'Skill 20', Pillar: 'K', Value: 0.1 },
            { Skills: 'Skill 21', Pillar: 'K', Value: 0.1 }, // 21 items total, 3 pages
        ];
        // User has 4 skills from mockUserSkills.
        render(<SkillsNeeded data={longData} skills={mockUserSkills} onSelectSkill={mockOnSelectSkill} />);

        const toggle = screen.getByRole('switch');
        await userEvent.click(toggle); // Toggle ON "Only My Skills"

        // Check that one of the user skills is visible (e.g., React)
        expect(screen.getByText('React')).toBeInTheDocument();
        // And a skill from page 2 of the unfiltered list is NOT visible
        expect(screen.queryByText(longData[10].Skills)).not.toBeInTheDocument();
        // And pagination should reflect being on page 1 (e.g. '1' is active)
        const page1Button = screen.getByRole('link', { name: '1' }).closest('li');
        expect(page1Button).toHaveClass('active');
    });



    test('calls onSelectSkill with the correct skill name when "eye" icon is clicked', async () => {
        render(<SkillsNeeded data={mockData.slice(0, 1)} skills={[]} onSelectSkill={mockOnSelectSkill} />); // Only 'React'
        
        const viewButton = screen.getByRole('button', { name: /more/i }); // Or use `aria-label`
        await userEvent.click(viewButton);

        expect(mockOnSelectSkill).toHaveBeenCalledTimes(1);
        expect(mockOnSelectSkill).toHaveBeenCalledWith('React');
    });



    test('handles empty data prop gracefully', () => {
        render(<SkillsNeeded data={[]} skills={mockUserSkills} onSelectSkill={mockOnSelectSkill} />);
        expect(screen.getByText('Skill')).toBeInTheDocument(); // Headers should still render
        expect(screen.queryByRole('row', { name: ''})).not.toBeInTheDocument(); // No data rows
        expect(screen.queryByRole('navigation')).not.toBeInTheDocument(); // No pagination
    });



    test('handles empty skills prop gracefully (no dots should appear)', () => {
        render(<SkillsNeeded data={mockData.slice(0,1)} skills={[]} onSelectSkill={mockOnSelectSkill} />);
        const reactSkillCell = screen.getByText('React').closest('td');
        const dot = reactSkillCell.querySelector('span[style*="background-color"]');
        expect(dot).not.toBeInTheDocument();
    });



    test('dynamic pagination displays ellipsis and first/last page links correctly', async () => {
        const manyItems = Array.from({ length: 100 }, (_, i) => ({
            Skills: `Skill ${i + 1}`, Pillar: 'K', Value: 0.5 
        }));
        render(<SkillsNeeded data={manyItems} skills={[]} onSelectSkill={mockOnSelectSkill} />);
        
        // Initial
        expect(screen.getByRole('link', { name: '1' })).toBeInTheDocument();
        expect(screen.getByText('...')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: '10' })).toBeInTheDocument();
        
        // Go to page 10
        await userEvent.click(screen.getByRole('link', { name: '10' }));
        expect(screen.getByRole('link', { name: '1' })).toBeInTheDocument();
        expect(screen.getByText('...')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: '9' })).toBeInTheDocument();

        // Go to page 1
        await userEvent.click(screen.getByRole('link', { name: '1' }));
        expect(screen.getByRole('link', { name: '1' }).closest('li')).toHaveClass('active');
        expect(screen.getByRole('link', { name: '3' })).toBeInTheDocument();
        expect(screen.getByText('...')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: '10' })).toBeInTheDocument();
    });
});