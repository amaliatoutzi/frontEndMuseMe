import http from './http';

export interface Profile {
	_id?: string;
	firstName?: string;
	lastName?: string;
	profilePictureUrl?: string;
	createdAt?: string;
	updatedAt?: string;
}

// Query: fetch profile for a user (may be absent)
export async function getProfile(user: string): Promise<Profile | null> {
	const { data } = await http.post('/Profile/_getProfile', { user });
	if (Array.isArray(data) && data.length > 0) {
		const first = data[0];
		if (first && typeof first === 'object' && 'profile' in first) {
			return (first as any).profile as Profile;
		}
	}
	// Some backends might return an object directly
	if (data && typeof data === 'object' && 'profile' in data) {
		return (data as any).profile as Profile;
	}
	return null;
}

// Action: add immutable first/last name (only if not set)
export async function addName(user: string, firstName: string, lastName: string): Promise<void> {
	await http.post('/Profile/addName', { user, firstName, lastName });
}

// Action: add profile picture when none exists
export async function addProfilePicture(user: string, url: string): Promise<void> {
	await http.post('/Profile/addProfilePicture', { user, url });
}

// Action: replace existing profile picture
export async function editProfilePicture(user: string, url: string): Promise<void> {
	await http.post('/Profile/editProfilePicture', { user, url });
}

// Action: remove existing profile picture
export async function removeProfilePicture(user: string): Promise<void> {
	await http.post('/Profile/removeProfilePicture', { user });
}
