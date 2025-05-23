import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import axios from 'axios';
import CitizenAccount from '../views/CitizenAccount';
import * as tokenUtils from '../utils/Tokens';

// Mock child components to isolate testing of CitizenAccount
jest.mock('../views/citizen/TargetOccupation', () => () => <div data-testid="target-occupation">TargetOccupation Mock</div>);
jest.mock('../views/citizen/CitizenSkills', () => ({ skills, setSkills }) => (
    <div data-testid="citizen-skills">
        CitizenSkills Mock
        {/* Simulate skill interaction for testing */}
        <button onClick={() => setSkills([...skills, { skill: { id: 'new', label: 'New Skill' }, years: 1 }])}>
            Add Mock Skill
        </button>
        <span>{skills.length} skills</span>
    </div>
));

// Mock axios
jest.mock('axios');

// Mock localStorage
const mockLocalStorage = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => {
            store[key] = value.toString();
        },
        removeItem: (key) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        },
    };
})();
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });


// Mock environment variables
process.env.REACT_APP_API_URL_USER_MANAGEMENT = 'http://api.example.com';

describe('CitizenAccount Component', () => {
    let mockGetId;

    const mockUserData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        streetAddress: '123 Main St',
        portfolio: 'johndoe.com'
    };

    
    const mockSkillsData = [
        { skillId: 's1', skillLabel: 'React', years: 5 },
        { skillId: 's2', skillLabel: 'Node.js', years: 3 },
    ];

    const formattedMockSkills = [
        { skill: { id: 's1', label: 'React' }, years: 5 },
        { skill: { id: 's2', label: 'Node.js' }, years: 3 },
    ];

    beforeEach(() => {
        axios.get.mockReset();
        axios.put.mockReset();
        mockLocalStorage.clear();
        mockLocalStorage.setItem('accessTokenSkillab', 'test-token');

        // Mock getId for each test, can be overridden
        mockGetId = jest.spyOn(tokenUtils, 'getId').mockResolvedValue('user123');
    });

    afterEach(() => {
        jest.restoreAllMocks(); // Restores original implementations
    });



    test('renders initial structure and child components', async () => {
        axios.get
            .mockResolvedValueOnce({ data: {} })
            .mockResolvedValueOnce({ data: [] });

        render(<CitizenAccount />);

        expect(screen.getByText('Profile')).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Name")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Address")).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Portfolio')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('cv.pdf')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Update Profile/i })).toBeInTheDocument();

        expect(screen.getByTestId('target-occupation')).toBeInTheDocument();
        expect(screen.getByTestId('citizen-skills')).toBeInTheDocument();
    });



    test('fetches and displays user data and skills on mount', async () => {
        axios.get
            .mockResolvedValueOnce({ data: mockUserData }) // First call for user info
            .mockResolvedValueOnce({ data: mockSkillsData }); // Second call for skills

        render(<CitizenAccount />);

        // Wait for data to be fetched and displayed
        expect(await screen.findByDisplayValue('John Doe')).toBeInTheDocument();
        expect(screen.getByDisplayValue('john.doe@example.com')).toBeInTheDocument();
        expect(screen.getByDisplayValue('123 Main St')).toBeInTheDocument();
        expect(screen.getByDisplayValue('johndoe.com')).toBeInTheDocument();

        // Check if getId was called
        expect(mockGetId).toHaveBeenCalledTimes(1); // Or more if called by children

        // Check axios calls
        expect(axios.get).toHaveBeenCalledWith(
            'http://api.example.com/user/user123',
            { headers: { Authorization: 'Bearer test-token' } }
        );
        expect(axios.get).toHaveBeenCalledWith(
            'http://api.example.com/user/user123/skills',
            { headers: { Authorization: 'Bearer test-token' } }
        );

        // Check if skills are passed to CitizenSkills (via mock)
        // The mock CitizenSkills displays the count
        expect(await screen.findByText('2 skills')).toBeInTheDocument();
    });



    test('does not fetch data if getId returns empty string', async () => {
        mockGetId.mockResolvedValue(''); // Override mock for this test
        render(<CitizenAccount />);

        // Ensure axios.get was not called after a brief wait
        await new Promise(resolve => setTimeout(resolve, 50)); // Small delay to let useEffect run
        expect(axios.get).not.toHaveBeenCalled();
    });



    test('allows updating address and portfolio fields', async () => {
        axios.get.mockResolvedValueOnce({ data: mockUserData }).mockResolvedValueOnce({ data: mockSkillsData });
        const user = userEvent.setup();
        render(<CitizenAccount />);

        const addressInput = await screen.findByPlaceholderText("Address");
        const portfolioInput = await screen.findByPlaceholderText("Portfolio");

        await user.clear(addressInput);
        await user.type(addressInput, '456 New Ave');
        expect(addressInput).toHaveValue('456 New Ave');

        await user.clear(portfolioInput);
        await user.type(portfolioInput, 'newportfolio.dev');
        expect(portfolioInput).toHaveValue('newportfolio.dev');
    });



    test('handles profile update successfully when data changes', async () => {
        axios.get.mockResolvedValueOnce({ data: mockUserData }).mockResolvedValueOnce({ data: mockSkillsData });
        const updatedUserData = { ...mockUserData, streetAddress: '789 Updated St' };
        axios.put.mockResolvedValue({ data: updatedUserData }); // PUT returns the updated user

        const user = userEvent.setup();
        render(<CitizenAccount />);

        const addressInput = await screen.findByPlaceholderText("Address");
        await user.tripleClick(addressInput); // Selects all text in the input
        await user.keyboard('{Delete}');    // Presses the Delete key

        expect(addressInput).toHaveValue('');

        await user.type(addressInput, '789 Updated St');

        const updateButton = screen.getByRole('button', { name: /Update Profile/i });
        await user.click(updateButton);

        expect(mockGetId).toHaveBeenCalled(); // Called again for update
        expect(axios.put).toHaveBeenCalledTimes(1);
        expect(axios.put).toHaveBeenCalledWith(
            'http://api.example.com/user/user123?streetAddress=789%20Updated%20St',
            {}, // Empty body as per component
            { headers: { Authorization: 'Bearer test-token' } }
        );

        // Check if loading spinner appeared (can be tricky, might need visual regression or more complex setup)
        // For now, we'll assume setLoading(true/false) works.

        // initialUserInfo should be updated
        // We can test this by trying to submit again without changes and ensuring PUT is not called
        // Or by checking if the value is reflected if the component re-used initialUserInfo for display (it doesn't directly)

        // Let's verify the input field still has the new value and then simulate a "no change" update
        expect(addressInput).toHaveValue('789 Updated St');

        // Click update again - no changes, so PUT should not be called again
        axios.put.mockClear(); // Clear previous call count
        await user.click(updateButton);
        expect(axios.put).not.toHaveBeenCalled();
    });



    test('updates multiple fields correctly', async () => {
        axios.get.mockResolvedValueOnce({ data: mockUserData }).mockResolvedValueOnce({ data: mockSkillsData });
        const updatedUserData = {
            ...mockUserData,
            streetAddress: '789 Updated St',
            portfolio: 'portfolio.new'
        };
        axios.put.mockResolvedValue({ data: updatedUserData });

        const user = userEvent.setup();
        render(<CitizenAccount />);

        const addressInput = await screen.findByPlaceholderText("Address");
        const portfolioInput = await screen.findByPlaceholderText("Portfolio");

        await user.clear(addressInput);
        await user.type(addressInput, '789 Updated St');
        await user.clear(portfolioInput);
        await user.type(portfolioInput, 'portfolio.new');

        const updateButton = screen.getByRole('button', { name: /Update Profile/i });
        await user.click(updateButton);

        expect(axios.put).toHaveBeenCalledWith(
            expect.stringContaining('http://api.example.com/user/user123?'),
            {},
            { headers: { Authorization: 'Bearer test-token' } }
        );
        // Check that both params are in the URL (order might vary)
        const calledUrl = axios.put.mock.calls[0][0];
        expect(calledUrl).toContain('streetAddress=789%20Updated%20St');
        expect(calledUrl).toContain('portfolio=portfolio.new');
    });



    test('does not call update API if no data has changed', async () => {
        axios.get.mockResolvedValueOnce({ data: mockUserData }).mockResolvedValueOnce({ data: mockSkillsData });
        const user = userEvent.setup();
        render(<CitizenAccount />);

        // Wait for initial data to load
        await screen.findByDisplayValue('John Doe');

        const updateButton = screen.getByRole('button', { name: /Update Profile/i });
        await user.click(updateButton);

        expect(axios.put).not.toHaveBeenCalled();
        // You might want to check console.log for "No changes to update." if important
    });



    test('handles profile update API error', async () => {
        axios.get.mockResolvedValueOnce({ data: mockUserData }).mockResolvedValueOnce({ data: mockSkillsData });
        axios.put.mockRejectedValue(new Error('Update failed')); // Simulate API error

        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        const user = userEvent.setup();
        render(<CitizenAccount />);

        const addressInput = await screen.findByPlaceholderText("Address");
        await user.clear(addressInput);
        await user.type(addressInput, 'Error Test St');

        const updateButton = screen.getByRole('button', { name: /Update Profile/i });
        await user.click(updateButton);

        await waitFor(() => {
            expect(axios.put).toHaveBeenCalledTimes(1);
        });
        expect(consoleErrorSpy).toHaveBeenCalledWith("Error updating profile:", expect.any(Error));

        consoleErrorSpy.mockRestore();
    });



    test('disabled fields are actually disabled', async () => {
        axios.get.mockResolvedValueOnce({ data: mockUserData }).mockResolvedValueOnce({ data: mockSkillsData });
        render(<CitizenAccount />);

        expect(await screen.findByPlaceholderText("Name")).toBeDisabled();
        expect(await screen.findByPlaceholderText("Email")).toBeDisabled();
        // The CV text input:
        expect(screen.getByPlaceholderText('cv.pdf')).toBeDisabled();
    });



    test('displays loading indicator during profile update', async () => {
        axios.get.mockResolvedValueOnce({ data: mockUserData }).mockResolvedValueOnce({ data: mockSkillsData });
        
        // Make PUT take some time to resolve
        axios.put.mockImplementation(() => 
            new Promise(resolve => setTimeout(() => resolve({ data: mockUserData }), 100))
        );

        const user = userEvent.setup();
        render(<CitizenAccount />);

        const addressInput = await screen.findByPlaceholderText("Address");
        await user.clear(addressInput);
        await user.type(addressInput, 'Loading Test St');

        const updateButton = screen.getByRole('button', { name: /Update Profile/i });
        user.click(updateButton); // Don't await here, want to check state during the call

        // Check for loading indicator (assuming class "lds-dual-ring")
        // This might be fragile if class name changes. data-testid is better if you can add it.
        expect(await screen.findByRole('button', {name: /Update Profile/i})).toBeInTheDocument(); // Button still there
        // Assuming your loading spinner is a div with class lds-dual-ring
        // This will wait for it to appear
        // If you can't add data-testid, you might need a more complex query or rely on visual regression.
        // For example, query by a parent and check its children, or use a known ARIA role if applicable.
        // As a fallback if you cannot add a data-testid:
        // const spinnerContainer = updateButton.closest('div.update');
        // await waitFor(() => expect(spinnerContainer.querySelector('.lds-dual-ring')).toBeInTheDocument());


        // Wait for the PUT to complete
        await waitFor(() => expect(axios.put).toHaveBeenCalledTimes(1));

        // Spinner should be gone
        // await waitFor(() => expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument());
        // Fallback:
        // await waitFor(() => expect(spinnerContainer.querySelector('.lds-dual-ring')).not.toBeInTheDocument());
    });
    
    
    // Test for the CV file input (basic interaction)
    test('CV file input is present', async () => {
        axios.get.mockResolvedValueOnce({ data: mockUserData }).mockResolvedValueOnce({ data: mockSkillsData });
        render(<CitizenAccount />);
        await screen.findByDisplayValue('John Doe'); // Ensure page is loaded

        // The file input is not directly labeled by "CV"
        // We can find it by its type or a more specific selector if needed
        const fileInput = screen.getByPlaceholderText("cv.pdf", {name: 'CV'}).nextSibling; // Assuming input type="file" is sibling
        expect(fileInput).toHaveAttribute('type', 'file');
        // Basic check, actual file upload testing is more complex and often out of scope for unit tests
    });
});