// src/app/dashboard/components/sections/ProfileEditModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useUnifiedAuth } from '@/auth/contexts/UnifiedAuthContext';
import CyberButton from '../../../components/common/CyberButton';
import { FirestoreUser, UpdateUserProfile } from '../../../../../types/user';
import {
	X,
	User,
	Mail,
	MapPin,
	Phone,
	Save,
	AlertCircle,
	CheckCircle,
	Loader
} from 'lucide-react';
import { handleAsyncOperation } from '@/utils/errorHandling';
import { calculateProfileCompleteness } from '@/utils/userHelpers';

interface ProfileEditModalProps {
	isOpen: boolean;
	onClose: () => void;
	firestoreUser: FirestoreUser;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
	isOpen,
	onClose,
	firestoreUser
}) => {
	const { updateProfile } = useUnifiedAuth();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	// フォームデータ
	const [formData, setFormData] = useState({
		displayName: '',
		nickname: '',
		address: {
			country: '',
			prefecture: '',
			city: '',
			addressLine1: '',
			addressLine2: '',
			postalCode: '',
			phone: ''
		}
	});

	// firestoreUserが変更されたときにフォームデータを更新
	useEffect(() => {
		if (firestoreUser) {
			setFormData({
				displayName: firestoreUser.displayName || '',
				nickname: firestoreUser.nickname || '',
				address: {
					country: firestoreUser.address?.country || '',
					prefecture: firestoreUser.address?.prefecture || '',
					city: firestoreUser.address?.city || '',
					addressLine1: firestoreUser.address?.addressLine1 || '',
					addressLine2: firestoreUser.address?.addressLine2 || '',
					postalCode: firestoreUser.address?.postalCode || '',
					phone: firestoreUser.address?.phone || ''
				}
			});
		}
	}, [firestoreUser]);

	// モーダルが閉じられたときの状態リセット
	useEffect(() => {
		if (!isOpen) {
			setError(null);
			setSuccess(false);
		}
	}, [isOpen]);

	const handleInputChange = (field: string, value: string) => {
		if (field.startsWith('address.')) {
			const addressField = field.replace('address.', '');
			setFormData(prev => ({
				...prev,
				address: {
					...prev.address,
					[addressField]: value
				}
			}));
		} else {
			setFormData(prev => ({
				...prev,
				[field]: value
			}));
		}
	};

	const validateForm = (): string[] => {
		const errors: string[] = [];

		if (!formData.displayName.trim()) {
			errors.push('Display name is required');
		}

		if (!formData.address.country.trim()) {
			errors.push('Country is required');
		}

		if (!formData.address.prefecture.trim()) {
			errors.push('Prefecture is required');
		}

		if (!formData.address.city.trim()) {
			errors.push('City is required');
		}

		if (!formData.address.addressLine1.trim()) {
			errors.push('Address line 1 is required');
		}

		if (!formData.address.postalCode.trim()) {
			errors.push('Postal code is required');
		}

		return errors;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setSuccess(false);
		setLoading(true);

		// バリデーション
		const validationErrors = validateForm();
		if (validationErrors.length > 0) {
			setError(validationErrors.join(', '));
			setLoading(false);
			return;
		}

		// プロフィール完成度をチェック
		const tempUser: FirestoreUser = {
			...firestoreUser,
			displayName: formData.displayName,
			nickname: formData.nickname,
			address: formData.address
		};
		const completeness = calculateProfileCompleteness(tempUser);

		const updateData: UpdateUserProfile = {
			displayName: formData.displayName,
			nickname: formData.nickname || undefined,
			address: formData.address,
			isProfileComplete: completeness.isComplete
		};

		const { error: updateError } = await handleAsyncOperation(
			() => updateProfile(updateData),
			'profile-update'
		);

		if (updateError) {
			setError(updateError.userMessage);
			setLoading(false);
			return;
		}

		setSuccess(true);
		setLoading(false);

		// 成功後に1.5秒でモーダルを閉じる
		setTimeout(() => {
			onClose();
		}, 1500);
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
			<div className="relative bg-black/90 backdrop-blur-md border border-neonGreen/30 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
				{/* Scanline effect */}
				<div className="absolute inset-0 overflow-hidden pointer-events-none">
					<div className="absolute w-full h-px bg-gradient-to-r from-transparent via-neonGreen to-transparent animate-scanline opacity-30"></div>
				</div>

				{/* Header */}
				<div className="relative p-6 border-b border-gray-700">
					<div className="flex justify-between items-center">
						<div>
							<h2 className="text-2xl font-heading font-bold text-white mb-1">
								Edit Profile
							</h2>
							<p className="text-sm text-gray-400">
								Update your information and complete your profile
							</p>
						</div>
						<button
							onClick={onClose}
							className="text-gray-400 hover:text-neonGreen transition-colors text-2xl font-light"
						>
							<X className="w-6 h-6" />
						</button>
					</div>
				</div>

				{/* Content */}
				<div className="relative p-6 max-h-[calc(90vh-140px)] overflow-y-auto">
					{/* Success Message */}
					{success && (
						<div className="bg-neonGreen/10 border border-neonGreen/30 text-neonGreen px-4 py-3 rounded-sm mb-6 flex items-center">
							<CheckCircle className="w-5 h-5 mr-3" />
							<span>Profile updated successfully!</span>
						</div>
					)}

					{/* Error Message */}
					{error && (
						<div className="bg-red-900/30 border border-red-500/50 text-red-300 px-4 py-3 rounded-sm mb-6 flex items-center">
							<AlertCircle className="w-5 h-5 mr-3" />
							<span>{error}</span>
						</div>
					)}

					<form onSubmit={handleSubmit} className="space-y-6">
						{/* Personal Information */}
						<div>
							<h3 className="text-lg font-semibold text-white mb-4 flex items-center">
								<User className="w-5 h-5 mr-2 text-neonGreen" />
								Personal Information
							</h3>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label htmlFor="displayName" className="block text-sm font-medium text-gray-300 mb-2">
										Display Name *
									</label>
									<input
										type="text"
										id="displayName"
										value={formData.displayName}
										onChange={(e) => handleInputChange('displayName', e.target.value)}
										required
										className="w-full px-4 py-3 bg-black/50 border border-gray-600 rounded-sm focus:outline-none focus:border-neonGreen focus:ring-1 focus:ring-neonGreen text-white placeholder-gray-500 transition-all duration-200"
										placeholder="Your display name"
									/>
								</div>

								<div>
									<label htmlFor="nickname" className="block text-sm font-medium text-gray-300 mb-2">
										Nickname
									</label>
									<input
										type="text"
										id="nickname"
										value={formData.nickname}
										onChange={(e) => handleInputChange('nickname', e.target.value)}
										className="w-full px-4 py-3 bg-black/50 border border-gray-600 rounded-sm focus:outline-none focus:border-neonGreen focus:ring-1 focus:ring-neonGreen text-white placeholder-gray-500 transition-all duration-200"
										placeholder="Optional nickname"
									/>
								</div>
							</div>
						</div>

						{/* Address Information */}
						<div>
							<h3 className="text-lg font-semibold text-white mb-4 flex items-center">
								<MapPin className="w-5 h-5 mr-2 text-neonGreen" />
								Address Information
							</h3>

							<div className="space-y-4">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label htmlFor="country" className="block text-sm font-medium text-gray-300 mb-2">
											Country *
										</label>
										<input
											type="text"
											id="country"
											value={formData.address.country}
											onChange={(e) => handleInputChange('address.country', e.target.value)}
											required
											className="w-full px-4 py-3 bg-black/50 border border-gray-600 rounded-sm focus:outline-none focus:border-neonGreen focus:ring-1 focus:ring-neonGreen text-white placeholder-gray-500 transition-all duration-200"
											placeholder="Japan"
										/>
									</div>

									<div>
										<label htmlFor="prefecture" className="block text-sm font-medium text-gray-300 mb-2">
											Prefecture/State *
										</label>
										<input
											type="text"
											id="prefecture"
											value={formData.address.prefecture}
											onChange={(e) => handleInputChange('address.prefecture', e.target.value)}
											required
											className="w-full px-4 py-3 bg-black/50 border border-gray-600 rounded-sm focus:outline-none focus:border-neonGreen focus:ring-1 focus:ring-neonGreen text-white placeholder-gray-500 transition-all duration-200"
											placeholder="Tokyo"
										/>
									</div>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label htmlFor="city" className="block text-sm font-medium text-gray-300 mb-2">
											City *
										</label>
										<input
											type="text"
											id="city"
											value={formData.address.city}
											onChange={(e) => handleInputChange('address.city', e.target.value)}
											required
											className="w-full px-4 py-3 bg-black/50 border border-gray-600 rounded-sm focus:outline-none focus:border-neonGreen focus:ring-1 focus:ring-neonGreen text-white placeholder-gray-500 transition-all duration-200"
											placeholder="Shibuya"
										/>
									</div>

									<div>
										<label htmlFor="postalCode" className="block text-sm font-medium text-gray-300 mb-2">
											Postal Code *
										</label>
										<input
											type="text"
											id="postalCode"
											value={formData.address.postalCode}
											onChange={(e) => handleInputChange('address.postalCode', e.target.value)}
											required
											className="w-full px-4 py-3 bg-black/50 border border-gray-600 rounded-sm focus:outline-none focus:border-neonGreen focus:ring-1 focus:ring-neonGreen text-white placeholder-gray-500 transition-all duration-200"
											placeholder="150-0001"
										/>
									</div>
								</div>

								<div>
									<label htmlFor="addressLine1" className="block text-sm font-medium text-gray-300 mb-2">
										Address Line 1 *
									</label>
									<input
										type="text"
										id="addressLine1"
										value={formData.address.addressLine1}
										onChange={(e) => handleInputChange('address.addressLine1', e.target.value)}
										required
										className="w-full px-4 py-3 bg-black/50 border border-gray-600 rounded-sm focus:outline-none focus:border-neonGreen focus:ring-1 focus:ring-neonGreen text-white placeholder-gray-500 transition-all duration-200"
										placeholder="1-1-1 Shibuya"
									/>
								</div>

								<div>
									<label htmlFor="addressLine2" className="block text-sm font-medium text-gray-300 mb-2">
										Address Line 2
									</label>
									<input
										type="text"
										id="addressLine2"
										value={formData.address.addressLine2}
										onChange={(e) => handleInputChange('address.addressLine2', e.target.value)}
										className="w-full px-4 py-3 bg-black/50 border border-gray-600 rounded-sm focus:outline-none focus:border-neonGreen focus:ring-1 focus:ring-neonGreen text-white placeholder-gray-500 transition-all duration-200"
										placeholder="Apartment, suite, etc. (optional)"
									/>
								</div>

								<div>
									<label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
										<Phone className="w-4 h-4 inline mr-1" />
										Phone Number
									</label>
									<input
										type="tel"
										id="phone"
										value={formData.address.phone}
										onChange={(e) => handleInputChange('address.phone', e.target.value)}
										className="w-full px-4 py-3 bg-black/50 border border-gray-600 rounded-sm focus:outline-none focus:border-neonGreen focus:ring-1 focus:ring-neonGreen text-white placeholder-gray-500 transition-all duration-200"
										placeholder="+81 90-1234-5678"
									/>
								</div>
							</div>
						</div>

						{/* Form Actions */}
						<div className="flex items-center justify-between pt-4 border-t border-gray-700">
							<div className="text-sm text-gray-400">
								<span className="text-red-400">*</span> Required fields
							</div>

							<div className="flex space-x-4">
								<CyberButton
									type="button"
									variant="outline"
									onClick={onClose}
									disabled={loading}
								>
									Cancel
								</CyberButton>

								<CyberButton
									type="submit"
									variant="primary"
									disabled={loading}
									className="flex items-center space-x-2"
								>
									{loading ? (
										<>
											<Loader className="w-4 h-4 animate-spin" />
											<span>Saving...</span>
										</>
									) : (
										<>
											<Save className="w-4 h-4" />
											<span>Save Changes</span>
										</>
									)}
								</CyberButton>
							</div>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
};