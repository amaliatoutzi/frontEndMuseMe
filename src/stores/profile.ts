import { defineStore } from 'pinia';
import type { Profile } from '../api/profile';
import { getProfile, addName as apiAddName, addProfilePicture as apiAddPic, editProfilePicture as apiEditPic, removeProfilePicture as apiRemovePic } from '../api/profile';
import { useAuthStore } from './auth';

export interface ProfileState {
	profile: Profile | null;
	loading: boolean;
	error: string | null;
}

export const useProfileStore = defineStore('profile', {
	state: (): ProfileState => ({
		profile: null,
		loading: false,
		error: null,
	}),
	getters: {
		hasName: (s) => !!(s.profile?.firstName && s.profile?.lastName),
		fullName: (s) =>
			s.profile?.firstName && s.profile?.lastName
				? `${s.profile.firstName} ${s.profile.lastName}`
				: null,
		initials: (s) => {
			const f = s.profile?.firstName?.[0] || '';
			const l = s.profile?.lastName?.[0] || '';
			const combined = `${f}${l}`.toUpperCase();
			return combined || null;
		},
	},
	actions: {
		clearError() { this.error = null; },
		async loadForCurrentUser() {
			this.loading = true; this.error = null;
			try {
				const auth = useAuthStore();
				const user = auth.currentUserId;
				if (!user) { this.profile = null; return; }
				const p = await getProfile(user);
				this.profile = p;
			} catch (e: any) {
				this.error = e?.response?.data?.error || e?.message || 'Failed to load profile';
				throw e;
			} finally {
				this.loading = false;
			}
		},
		async addName(firstName: string, lastName: string) {
			this.loading = true; this.error = null;
			try {
				const auth = useAuthStore();
				const user = auth.currentUserId;
				if (!user) throw new Error('Not authenticated');
				await apiAddName(user, firstName.trim(), lastName.trim());
				// refresh profile
				await this.loadForCurrentUser();
			} catch (e: any) {
				this.error = e?.response?.data?.error || e?.message || 'Failed to save name';
				throw e;
			} finally {
				this.loading = false;
			}
		},
		async addProfilePicture(url: string) {
			this.loading = true; this.error = null;
			try {
				const auth = useAuthStore();
				const user = auth.currentUserId;
				if (!user) throw new Error('Not authenticated');
				await apiAddPic(user, url);
				await this.loadForCurrentUser();
			} catch (e: any) {
				this.error = e?.response?.data?.error || e?.message || 'Failed to add picture';
				throw e;
			} finally { this.loading = false; }
		},
		async editProfilePicture(url: string) {
			this.loading = true; this.error = null;
			try {
				const auth = useAuthStore();
				const user = auth.currentUserId;
				if (!user) throw new Error('Not authenticated');
				await apiEditPic(user, url);
				await this.loadForCurrentUser();
			} catch (e: any) {
				this.error = e?.response?.data?.error || e?.message || 'Failed to update picture';
				throw e;
			} finally { this.loading = false; }
		},
		async removeProfilePicture() {
			this.loading = true; this.error = null;
			try {
				const auth = useAuthStore();
				const user = auth.currentUserId;
				if (!user) throw new Error('Not authenticated');
				await apiRemovePic(user);
				await this.loadForCurrentUser();
			} catch (e: any) {
				this.error = e?.response?.data?.error || e?.message || 'Failed to remove picture';
				throw e;
			} finally { this.loading = false; }
		},
	},
});
