import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import SkillSelection from '../../views/citizen/SkillSelection';

// Tell Jest to use the mock implementation for axios
jest.mock('axios');
// Mock process.env
const OLD_ENV = process.env;


describe('SkillSelection Component', () => {
    let mockOnAddSkill;

    beforeEach(() => {
        // Reset environment variables
        jest.resetModules(); // Ψleaρ the cache
        process.env = { ...OLD_ENV }; // Make a copy
        process.env.REACT_APP_API_URL_TRACKER = 'http://mockapi.com';

        mockOnAddSkill = jest.fn();
        axios.post.mockClear(); // Clear any previous mock usage data
        window.localStorage.clear(); // Clear localStorage mock
        window.localStorage.setItem('accessTokenSkillabTracker', 'test-token'); // Set a mock token
    });

    afterAll(() => {
        process.env = OLD_ENV; // Restore old environment
    });



    test('renders initial state correctly', () => {
        render(<SkillSelection onAddSkill={mockOnAddSkill} />);

        expect(screen.getByPlaceholderText('Type a skill...')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Years')).toBeInTheDocument();
        expect(screen.getByRole('button').querySelector('.fa-plus-circle')).toBeInTheDocument();
    });



    test('does not fetch skills if search term is less than 3 characters', async () => {
        render(<SkillSelection onAddSkill={mockOnAddSkill} />);
        const skillInput = screen.getByPlaceholderText('Type a skill...');

        await userEvent.type(skillInput, 're');
        expect(axios.post).not.toHaveBeenCalled();
    });

    

    test('fetches skills with pagination until no more items', async () => {
        const mockSkillsPage1 = { data: { items: [{ id: '1', label: 'React' }] } };
        const mockSkillsPage2 = { data: { items: [{ id: '2', label: 'Redux' }] } };
        const mockSkillsPage3Empty = { data: { items: [] } };

        // Create promises that we can resolve manually
        let resolvePage1, resolvePage2, resolvePage3;
        axios.post
            .mockImplementationOnce(() => new Promise(r => { resolvePage1 = () => r(mockSkillsPage1); }))
            .mockImplementationOnce(() => new Promise(r => { resolvePage2 = () => r(mockSkillsPage2); }))
            .mockImplementationOnce(() => new Promise(r => { resolvePage3 = () => r(mockSkillsPage3Empty); }));

        render(<SkillSelection onAddSkill={mockOnAddSkill} />);
        const skillInput = screen.getByPlaceholderText('Type a skill...');

        userEvent.type(skillInput, 'dev');
        await screen.findByText('Loading...'); // This should pass if setIsLoading(true) is hit

        // Ensure the first API call was initiated (resolvePage1 should be defined)
        await waitFor(() => expect(resolvePage1).toBeDefined());
        resolvePage1();

        await waitFor(() => expect(resolvePage2).toBeDefined());
        resolvePage2();

        await waitFor(() => expect(resolvePage3).toBeDefined());
        resolvePage3();

        // Wait for all API calls to be registered by the mock
        await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(3), { timeout: 3000 });

        // After all pages are fetched and finally block runs, Loading... should be gone
        await waitFor(() => expect(screen.queryByText('Loading...')).not.toBeInTheDocument());

        // Triggers filtering useEffect
        fireEvent.change(skillInput, { target: { value: 'Rea' } });

        // Check if 'React' (from page 1) is now filterable
        await screen.findByText('React');
    });
    


    test('fetches skills with pagination until no more items', async () => {
        const mockSkillsPage1Data = { data: { items: [{ id: '1', label: 'React' }] } };
        const mockSkillsPage2Data = { data: { items: [{ id: '2', label: 'Redux' }] } };
        const mockSkillsPage3EmptyData = { data: { items: [] } };

        let resolveCall1, resolveCall2, resolveCall3;
        axios.post
            .mockImplementationOnce(() => { // First call (page 1)
                return new Promise(resolve => {
                    resolveCall1 = () => {
                        resolve(mockSkillsPage1Data);
                    };
                });
            })
            .mockImplementationOnce(() => { // Second call (page 2)
                return new Promise(resolve => {
                    resolveCall2 = () => {
                        resolve(mockSkillsPage2Data);
                    };
                });
            })
            .mockImplementationOnce(() => { // Third call (page 3, empty)
                return new Promise(resolve => {
                    resolveCall3 = () => {
                        resolve(mockSkillsPage3EmptyData);
                    };
                });
            });

        render(<SkillSelection onAddSkill={mockOnAddSkill} />);
        const skillInput = screen.getByPlaceholderText('Type a skill...');
        
        // Type to trigger the fetch.
        await userEvent.type(skillInput, 'dev'); 

        // 1. CHECK FOR LOADING STATE:
        await screen.findByText('Loading...');

        // 2. RESOLVE API CALLS AND CHECK MOCK INVOCATIONS
        await waitFor(() => expect(resolveCall1).toBeDefined(), { timeout: 1000 });
        resolveCall1();

        // Ensure the mock was prepared for the second call
        await waitFor(() => expect(resolveCall2).toBeDefined(), { timeout: 1000 });
        resolveCall2();

        // Ensure the mock was prepared for the third call
        await waitFor(() => expect(resolveCall3).toBeDefined(), { timeout: 1000 });
        resolveCall3();

        // Now wait for all three `axios.post` calls to be registered by Jest's mock system.
        await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(3), { timeout: 3000 });

        // Verify the arguments of each call
        const expectedSearchParams = new URLSearchParams({ keywords: 'dev' });
        expect(axios.post).toHaveBeenNthCalledWith(1, 
            'http://mockapi.com/api/skills', 
            expectedSearchParams,
            expect.objectContaining({ params: { page: '1' }})
        );
        expect(axios.post).toHaveBeenNthCalledWith(2, 
            'http://mockapi.com/api/skills', 
            expectedSearchParams,
            expect.objectContaining({ params: { page: '2' }})
        );
        expect(axios.post).toHaveBeenNthCalledWith(3, 
            'http://mockapi.com/api/skills', 
            expectedSearchParams,
            expect.objectContaining({ params: { page: '3' }})
        );

        // 3. CHECK LOADING STATE DISAPPEARS & SKILLS ARE FILTERABLE
        await waitFor(() => expect(screen.queryByText('Loading...')).not.toBeInTheDocument());
        
        // Νo suggestions should be visible yet based on the "dev" search term.
        expect(screen.queryByText('React')).not.toBeInTheDocument();
        expect(screen.queryByText('Redux')).not.toBeInTheDocument();

        // Change searchTerm to "Rea". This will update searchTerm.
        fireEvent.change(skillInput, { target: { value: 'Rea' } });
        
        await waitFor(() => {
            expect(screen.getByText('React')).toBeInTheDocument();
        });

        expect(screen.queryByText('Redux')).not.toBeInTheDocument();
    });



    test('filters displayed skills when typing more after initial fetch', async () => {
        const mockSkills = {
        data: {
            items: [
                { id: '1', label: 'React Testing Library' },
                { id: '2', label: 'React Native' },
                { id: '3', label: 'Angular' },
            ],
        },
        };
        // For pagination stop
        const mockEmptySkills = { data: { items: [] } };
        axios.post
            .mockResolvedValueOnce(mockSkills)
            .mockResolvedValueOnce(mockEmptySkills);

        render(<SkillSelection onAddSkill={mockOnAddSkill} />);
        const skillInput = screen.getByPlaceholderText('Type a skill...');

        await userEvent.type(skillInput, 'Rea'); // Initial fetch
        await waitFor(() => expect(screen.getByText('React Testing Library')).toBeInTheDocument());
        expect(screen.getByText('React Native')).toBeInTheDocument();
        expect(screen.queryByText('Angular')).not.toBeInTheDocument(); // Not initially visible

        await userEvent.type(skillInput, 'ct N'); // Further typing: "React N"
        
        await waitFor(() => {
            expect(screen.queryByText('React Testing Library')).not.toBeInTheDocument();
            expect(screen.getByText('React Native')).toBeInTheDocument();
        });
    });



    test('allows selecting a skill from suggestions', async () => {
        const mockSkills = {
            data: { items: [{ id: '1', label: 'React' }, { id: '2', label: 'Redux' }] },
        };
        axios.post.mockResolvedValueOnce(mockSkills).mockResolvedValueOnce({data: {items: []}});

        render(<SkillSelection onAddSkill={mockOnAddSkill} />);
        const skillInput = screen.getByPlaceholderText('Type a skill...');
        await userEvent.type(skillInput, 'rea');
        
        const reactOption = await screen.findByText('React'); // Wait for it to appear
        await userEvent.click(reactOption);

        // Check if the skill pill is displayed
        expect(screen.getByText('React')).toBeInTheDocument();
        // Check if the 'x' button for removal is present next to 'React'
        const skillPill = screen.getByText('React').closest('div');
        expect(skillPill.querySelector('button')).toBeInTheDocument();

        // Input should be hidden, suggestions cleared
        expect(screen.queryByPlaceholderText('Type a skill...')).not.toBeInTheDocument();
        expect(screen.queryByText('Redux')).not.toBeInTheDocument(); // Other suggestions gone
    });



    test('allows removing a selected skill', async () => {
        const mockSkills = {
            data: { items: [{ id: '1', label: 'React' }] },
        };
        axios.post.mockResolvedValueOnce(mockSkills).mockResolvedValueOnce({data: {items: []}});

        render(<SkillSelection onAddSkill={mockOnAddSkill} />);
        const skillInput = screen.getByPlaceholderText('Type a skill...');
        await userEvent.type(skillInput, 'rea');
        
        const reactOption = await screen.findByText('React');
        await userEvent.click(reactOption);

        // Pill is shown
        const skillPill = screen.getByText('React').closest('div');
        const removeButton = skillPill.querySelector('button');
        expect(removeButton).toBeInTheDocument();

        await userEvent.click(removeButton);

        // Skill pill should be gone
        expect(screen.queryByText('React')).not.toBeInTheDocument();
        // Search input should reappear
        expect(screen.getByPlaceholderText('Type a skill...')).toBeInTheDocument();
    });



    test('calls onAddSkill with selected skill and years, then resets', async () => {
        const mockSkills = {
            data: { items: [{ id: 's1', label: 'JavaScript' }] },
        };
        axios.post.mockResolvedValueOnce(mockSkills).mockResolvedValueOnce({data: {items: []}});

        render(<SkillSelection onAddSkill={mockOnAddSkill} />);
        
        // Type and select skill
        const skillInput = screen.getByPlaceholderText('Type a skill...');
        await userEvent.type(skillInput, 'Jav');
        const skillOption = await screen.findByText('JavaScript');
        await userEvent.click(skillOption);

        // Type years
        const yearsInput = screen.getByPlaceholderText('Years');
        await userEvent.type(yearsInput, '5');
        expect(yearsInput).toHaveValue('5');


        // Click add button (assuming aria-label="Add selected skill")
        const addButton = screen.getByRole('button', { name: /add selected skill/i }) || screen.getByRole('button'); 
        await userEvent.click(addButton);

        // Assert onAddSkill was called
        expect(mockOnAddSkill).toHaveBeenCalledTimes(1);
        expect(mockOnAddSkill).toHaveBeenCalledWith({
            skill: { id: 's1', label: 'JavaScript' },
            years: '5',
        });

        // Assert form is reset
        expect(screen.getByPlaceholderText('Type a skill...')).toBeInTheDocument(); // Skill input back
        expect(screen.queryByText('JavaScript')).not.toBeInTheDocument(); // Pill gone
        expect(screen.getByPlaceholderText('Years')).toHaveValue(''); // Years cleared
    });



    test('does not add same skill twice to selected list', async () => {
        const mockSkills = {
            data: { items: [{ id: '1', label: 'React' }] },
        };
        axios.post.mockResolvedValueOnce(mockSkills).mockResolvedValueOnce({data: {items: []}});

        render(<SkillSelection onAddSkill={mockOnAddSkill} />);
        const skillInput = screen.getByPlaceholderText('Type a skill...');
        
        // First selection
        await userEvent.type(skillInput, 'rea');
        let reactOption = await screen.findByText('React');
        await userEvent.click(reactOption);

        // The skill pill is displayed, input is hidden. Let's remove it to re-select.
        const skillPill = screen.getByText('React').closest('div');
        const removeButton = skillPill.querySelector('button');
        await userEvent.click(removeButton);

        // Find it again in suggestions
        expect(screen.getByPlaceholderText('Type a skill...')).toBeInTheDocument();
        await userEvent.type(screen.getByPlaceholderText('Type a skill...'), 'rea');
        reactOption = await screen.findByText('React');
        await userEvent.click(reactOption);

        // We should still only have one "React" pill
        const pills = screen.getAllByText('React');
        expect(pills.length).toBe(1);
    });

});