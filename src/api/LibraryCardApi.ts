import { format, addDays } from 'date-fns';
import { endpointBE } from '../layouts/utils/Constant';
import { toast } from 'react-toastify';

// Types
export interface LibraryCard {
    id: number;
    idLibraryCard: number;
    cardNumber: string;
    userName: string;
    issuedDate: string;
    expiryDate: string;
    activated: boolean;
    status: string;
    userId?: number;
    violationCount?: number;
}

export interface LibraryCardWithUser extends LibraryCard {
    user?: {
        idUser: number;
        username: string;
        firstName: string;
        lastName: string;
        email: string;
    };
}

export interface LibraryCardResponse {
    content: LibraryCard[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
}

class LibraryCardApi {
    /**
     * Get the authentication token from local storage
     */
    private getToken(): string {
        const token = localStorage.getItem("token");
        if (!token) {
            throw new Error("Authentication token not found");
        }
        return token;
    }

    public async fetchLibraryCardsWithUsers(): Promise<LibraryCardWithUser[]> {
        try {
            const response = await fetch(`${endpointBE}/library-cards?projection=full&size=1000`, {
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error("Failed to fetch library cards");
            }

            const data = await response.json();
            if (data._embedded && data._embedded.libraryCards) {
                const processedCards = await Promise.all(
                    data._embedded.libraryCards.map(async (card: any) => {
                        let user = undefined;

                        try {
                            // Get user data if available
                            if (card._embedded && card._embedded.user) {
                                const userData = card._embedded.user;
                                user = {
                                    idUser: userData.idUser,
                                    username: userData.username,
                                    firstName: userData.firstName || "",
                                    lastName: userData.lastName || "",
                                    email: userData.email || ""
                                };
                            }
                        } catch (err) {
                            console.error("Error processing user data:", err);
                        }

                        // Check if card is expired
                        const expiryDate = card.expiryDate ? new Date(card.expiryDate) : null;
                        const isExpired = expiryDate ? new Date() > expiryDate : false;
                        const activated = isExpired ? false : card.activated;

                        return {
                            id: card.idLibraryCard,
                            idLibraryCard: card.idLibraryCard,
                            cardNumber: card.cardNumber || "",
                            userName: user ? `${user.firstName} ${user.lastName}`.trim() || user.username : "Unknown",
                            userId: user?.idUser || 0,
                            issuedDate: card.issuedDate,
                            expiryDate: card.expiryDate,
                            activated,
                            status: card.status || "",
                            violationCount: 0, // Will be set separately if needed
                            user
                        };
                    })
                );

                return processedCards;
            }
            return [];
        } catch (error) {
            console.error("Error fetching library cards with users:", error);
            throw error;
        }
    }

    /**
     * Search library cards by card number or username
     */
    public async searchLibraryCards(searchTerm: string): Promise<LibraryCardWithUser[]> {
        try {
            const allCards = await this.fetchLibraryCardsWithUsers();

            if (!searchTerm.trim()) {
                return allCards.filter(card => card.activated);
            }

            const searchLower = searchTerm.toLowerCase();

            return allCards.filter(card => {
                if (!card.activated) return false;

                return (
                    card.cardNumber?.toLowerCase().includes(searchLower) ||
                    card.user?.username?.toLowerCase().includes(searchLower) ||
                    card.user?.firstName?.toLowerCase().includes(searchLower) ||
                    card.user?.lastName?.toLowerCase().includes(searchLower) ||
                    card.user?.email?.toLowerCase().includes(searchLower) ||
                    `${card.user?.firstName} ${card.user?.lastName}`.toLowerCase().includes(searchLower)
                );
            });
        } catch (error) {
            console.error("Error searching library cards:", error);
            throw error;
        }
    }

    /**
     * Create headers with authentication token
     */
    private getHeaders(includeContentType: boolean = false): HeadersInit {
        const headers: HeadersInit = {
            Authorization: `Bearer ${this.getToken()}`
        };

        if (includeContentType) {
            headers["Content-Type"] = "application/json";
        }

        return headers;
    }

    /**
     * Format date for display (dd/MM/yyyy)
     */
    public formatDate(dateString?: string): string {
        if (!dateString) return "—";
        try {
            return format(new Date(dateString), "dd/MM/yyyy");
        } catch (e) {
            return dateString;
        }
    }

    /**
     * Calculate days until expiry
     */
    public getDaysUntilExpiry(expiryDate: string): number {
        try {
            const expiry = new Date(expiryDate);
            const today = new Date();
            const diffTime = expiry.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays;
        } catch (e) {
            return 0;
        }
    }

    /**
     * Get expiry status text and color
     */
    public getExpiryStatus(expiryDate: string): { text: string; color: 'error' | 'warning' | 'success' } {
        const daysUntil = this.getDaysUntilExpiry(expiryDate);

        if (daysUntil < 0) {
            return { text: `Hết hạn ${Math.abs(daysUntil)} ngày trước`, color: "error" };
        } else if (daysUntil === 0) {
            return { text: "Hết hạn hôm nay", color: "error" };
        } else if (daysUntil <= 30) {
            return { text: `Sắp hết hạn (còn ${daysUntil} ngày)`, color: "warning" };
        } else {
            return { text: `Còn hạn (${daysUntil} ngày)`, color: "success" };
        }
    }

    /**
     * Create a new library card
     */
    public async createCard(cardId: number, userId: number, cardNumber: string): Promise<void> {
        try {
            const response = await fetch(`${endpointBE}/library-card/create`, {
                method: "PUT",
                headers: this.getHeaders(true),
                body: JSON.stringify({
                    idUser: userId,
                    cardNumber: cardNumber
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "Failed to create library card");
            }
        } catch (error) {
            console.error("Error creating library card:", error);
            throw error;
        }
    }

    /**
     * Fetch all library cards
     */
    public async fetchAllLibraryCards(): Promise<LibraryCard[]> {
        try {
            const response = await fetch(`${endpointBE}/library-cards?projection=full&size=1000`, {
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error("Failed to fetch library cards");
            }

            const data = await response.json();
            if (data._embedded && data._embedded.libraryCards) {
                const processedCards = await Promise.all(
                    data._embedded.libraryCards.map(async (card: any) => {
                        let userName = "Unknown";
                        let userId = 0;
                        let violationCount = 0;

                        try {
                            // Gán thông tin người dùng nếu có
                            if (card._embedded?.user) {
                                const userData = card._embedded.user;
                                userName = `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || userData.username;
                                userId = userData.idUser;
                            }

                            // Gọi fetch đến endpoint violationTypes
                            if (card._links?.violationTypes?.href) {
                                const violationRes = await fetch(card._links.violationTypes.href, {
                                    headers: this.getHeaders() // có cần token thì lấy từ đây
                                });

                                if (violationRes.ok) {
                                    const violationData = await violationRes.json();
                                    const violations = violationData._embedded?.libraryViolationTypes || [];

                                    violationCount = violations.length;

                                    console.log(`Card ${card.cardNumber} có ${violationCount} lỗi`);
                                } else {
                                    console.warn(`Không thể lấy lỗi của card ${card.cardNumber}`);
                                }
                            } else {
                                console.warn(`Card ${card.cardNumber} không có link violationTypes`);
                            }

                        } catch (err) {
                            console.error("Lỗi khi xử lý thẻ:", err);
                        }

                        // Xử lý ngày hết hạn
                        const expiryDate = card.expiryDate ? new Date(card.expiryDate) : null;
                        const isExpired = expiryDate ? new Date() > expiryDate : false;
                        const activated = isExpired ? false : card.activated;

                        return {
                            id: card.idLibraryCard,
                            idLibraryCard: card.idLibraryCard,
                            cardNumber: card.cardNumber || "",
                            userName,
                            userId,
                            issuedDate: card.issuedDate,
                            expiryDate: card.expiryDate,
                            activated,
                            status: card.status || "",
                            violationCount
                        };
                    })
                );

                return processedCards;
            }

            return [];
        } catch (error) {
            console.error("Lỗi khi fetch thẻ thư viện:", error);
            throw error;
        }
    }


    /**
     * Fetch a single library card by ID
     */
    public async fetchLibraryCardById(id: number): Promise<LibraryCard> {
        try {
            const response = await fetch(`${endpointBE}/library-cards/${id}`, {
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error("Failed to fetch library card");
            }

            const card = await response.json();
            let userName = "Unknown";
            let userId = 0;
            let violationCount = 0;

            try {
                // Get user data if available
                if (card._embedded && card._embedded.user) {
                    const userData = card._embedded.user;
                    userName = `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || userData.username;
                    userId = userData.idUser;
                }

                // Count violations
                if (card._embedded && card._embedded.violationTypes) {
                    violationCount = card._embedded.violationTypes.length;
                }
            } catch (err) {
                console.error("Error processing user data:", err);
            }

            // Check if card is expired
            const expiryDate = card.expiryDate ? new Date(card.expiryDate) : null;
            const isExpired = expiryDate ? new Date() > expiryDate : false;
            const activated = isExpired ? false : card.activated;

            return {
                id: card.idLibraryCard,
                idLibraryCard: card.idLibraryCard,
                cardNumber: card.cardNumber || "",
                userName,
                userId,
                issuedDate: card.issuedDate,
                expiryDate: card.expiryDate,
                activated,
                status: card.status || "",
                violationCount
            };
        } catch (error) {
            console.error("Error fetching library card:", error);
            throw error;
        }
    }

    /**
     * Renew library card
     */
    public async renewCard(cardId: number): Promise<void> {
        try {
            const response = await fetch(`${endpointBE}/library-card/renew`, {
                method: "PUT",
                headers: this.getHeaders(true),
                body: JSON.stringify({
                    idLibraryCard: cardId
                })
            });

            if (!response.ok) {
                throw new Error("Failed to renew library card");
            }
        } catch (error) {
            console.error("Error renewing library card:", error);
            throw error;
        }
    }

    /**
     * Deactivate library card
     */
    public async deactivateCard(cardId: number): Promise<void> {
        try {
            const response = await fetch(`${endpointBE}/library-card/deactivate`, {
                method: "PUT",
                headers: this.getHeaders(true),
                body: JSON.stringify({
                    idLibraryCard: cardId
                })
            });

            if (!response.ok) {
                throw new Error("Failed to deactivate library card");
            }
        } catch (error) {
            console.error("Error deactivating library card:", error);
            throw error;
        }
    }

    /**
     * Activate library card
     */
    public async activateCard(cardId: number, userId: number, cardNumber: string): Promise<void> {
        try {
            // First update the expiry date
            const activateResponse = await fetch(`${endpointBE}/library-card/create`, {
                method: "PUT",
                headers: this.getHeaders(true),
                body: JSON.stringify({
                    idUser: userId,
                    cardNumber: cardNumber
                })
            });

            const updateResponse = await fetch(`${endpointBE}/library-card/update`, {
                method: "PUT",
                headers: this.getHeaders(true),
                body: JSON.stringify({
                    idLibraryCard: cardId,
                    expiryNewDate: format(addDays(new Date(), 365), "yyyy-MM-dd")
                })
            });

            if (!updateResponse.ok) {
                throw new Error("Failed to update library card expiry date");
            }
            if (!activateResponse.ok) {
                throw new Error("Failed to activate library card");
            }
        } catch (error) {
            console.error("Error activating library card:", error);
            throw error;
        }
    }
}

export default new LibraryCardApi();