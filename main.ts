import { App, Plugin, PluginSettingTab, Setting, TFile, Notice, MarkdownPostProcessorContext } from 'obsidian';

interface LevelingPluginSettings {
	totalExp: number;
	currentLevel: number;
}

const DEFAULT_SETTINGS: LevelingPluginSettings = {
	totalExp: 0,
	currentLevel: 1
}

// EXP categories that will be read from YAML frontmatter
const EXP_CATEGORIES = [
	'Tasks',
	'Missions',
	'Exploration',
	'Training',
	'Battles',
	'Crafting'
];

// Category emojis
const CATEGORY_EMOJIS: { [key: string]: string } = {
	'Tasks': '🧾',
	'Missions': '🗺️',
	'Exploration': '🌍',
	'Training': '🥋',
	'Battles': '⚔️',
	'Crafting': '🛠️'
};

// Attributes that can be used as aliases in parentheses
const ATTRIBUTES = [
	'Intel',
	'Spiritual',
	'Core',
	'Emotional',
	'Physical'
];

// Attribute emojis for radar chart
const ATTRIBUTE_EMOJIS: { [key: string]: string } = {
	'Intel': '🧠',
	'Spiritual': '✨',
	'Core': '💎',
	'Emotional': '🌀',
	'Physical': '💪'
};

// Wheel of Life areas
const WHEEL_OF_LIFE_AREAS = [
	'Spiritual',
	'Family',
	'Financial',
	'Emotional',
	'Physical Health',
	'Intellectual',
	'Professional',
	'Social',
	'Romantic',
	'Leisure',
	'Purpose',
	'Environment'
];

// Wheel of Life aliases (used in frontmatter)
const WHEEL_OF_LIFE_ALIASES: { [key: string]: string } = {
	'Spirituality': 'Spiritual',
	'Family': 'Family',
	'Financial': 'Financial',
	'Emotions': 'Emotional',
	'Physical Health': 'Physical Health',
	'Intellectual': 'Intellectual',
	'Professional': 'Professional',
	'Social': 'Social',
	'Romantic': 'Romantic',
	'Leisure': 'Leisure',
	'Purpose': 'Purpose',
	'Environment': 'Environment'
};

// Wheel of Life emojis
const WHEEL_OF_LIFE_EMOJIS: { [key: string]: string } = {
	'Spiritual': '✨',
	'Family': '👨‍👩‍👧‍👦',
	'Financial': '💰',
	'Emotional': '❤️',
	'Physical Health': '💪',
	'Intellectual': '📚',
	'Professional': '💼',
	'Social': '🤝',
	'Romantic': '💕',
	'Leisure': '🎮',
	'Purpose': '🎯',
	'Environment': '🌍'
};

// SWOT categories (base categories)
const SWOT_CATEGORIES = [
	'Strengths',
	'Weaknesses',
	'Opportunities',
	'Threats'
];

// SWOT emojis
const SWOT_EMOJIS: { [key: string]: string } = {
	'Strengths': '💪',
	'Weaknesses': '⚠️',
	'Opportunities': '🎯',
	'Threats': '⚡'
};

// Skill types
const SKILL_TYPES = [
	'Soft',
	'Hard',
	'Power',
	'Perk'
];

// Skill type emojis
const SKILL_TYPE_EMOJIS: { [key: string]: string } = {
	'Soft': '🎼',
	'Hard': '🔨',
	'Power': '🦅',
	'Perk': '🧘'
};

const EXP_PER_POINT = 100; // Each point in a category = 100 EXP
const MAX_POINTS_PER_CATEGORY = 10; // Maximum value per category

// Rank table
const RANK_TABLE = [
	{ rank: 'F', exp: 0 },
	{ rank: 'E', exp: 250 },
	{ rank: 'D', exp: 900 },
	{ rank: 'C–', exp: 1500 },
	{ rank: 'C', exp: 2400 },
	{ rank: 'C+', exp: 3600 },
	{ rank: 'C++', exp: 5200 },
	{ rank: 'B–', exp: 7200 },
	{ rank: 'B', exp: 9700 },
	{ rank: 'B+', exp: 13200 },
	{ rank: 'B++', exp: 18200 },
	{ rank: 'A–', exp: 24700 },
	{ rank: 'A', exp: 33200 },
	{ rank: 'A+', exp: 43200 },
	{ rank: 'A++', exp: 55200 },
	{ rank: 'S–', exp: 70200 },
	{ rank: 'S', exp: 93200 },
	{ rank: 'S+', exp: 120200 },
	{ rank: 'SS', exp: 155200 },
	{ rank: 'SS+', exp: 200200 },
	{ rank: 'EX', exp: 260200 },
	{ rank: 'EX+', exp: 520400 },
	{ rank: 'EX++', exp: 1040800 },
	{ rank: 'EX+++', exp: 2081600 }
];

// Level table - From 0 to 100, then +5000 per level until 999
const LEVEL_TABLE = [
	{ level: 0, exp: 0 },
	{ level: 1, exp: 100 },
	{ level: 2, exp: 300 },
	{ level: 3, exp: 600 },
	{ level: 4, exp: 1000 },
	{ level: 5, exp: 1500 },
	{ level: 6, exp: 2100 },
	{ level: 7, exp: 2800 },
	{ level: 8, exp: 3600 },
	{ level: 9, exp: 4500 },
	{ level: 10, exp: 5500 },
	{ level: 11, exp: 6600 },
	{ level: 12, exp: 7800 },
	{ level: 13, exp: 9100 },
	{ level: 14, exp: 10500 },
	{ level: 15, exp: 12000 },
	{ level: 16, exp: 13600 },
	{ level: 17, exp: 15300 },
	{ level: 18, exp: 17100 },
	{ level: 19, exp: 19000 },
	{ level: 20, exp: 21000 },
	{ level: 21, exp: 23100 },
	{ level: 22, exp: 25300 },
	{ level: 23, exp: 27600 },
	{ level: 24, exp: 30000 },
	{ level: 25, exp: 32500 },
	{ level: 26, exp: 35100 },
	{ level: 27, exp: 37800 },
	{ level: 28, exp: 40600 },
	{ level: 29, exp: 43500 },
	{ level: 30, exp: 46500 },
	{ level: 31, exp: 49600 },
	{ level: 32, exp: 52800 },
	{ level: 33, exp: 56100 },
	{ level: 34, exp: 59500 },
	{ level: 35, exp: 63000 },
	{ level: 36, exp: 66600 },
	{ level: 37, exp: 70300 },
	{ level: 38, exp: 74100 },
	{ level: 39, exp: 78000 },
	{ level: 40, exp: 82000 },
	{ level: 41, exp: 86100 },
	{ level: 42, exp: 90300 },
	{ level: 43, exp: 94600 },
	{ level: 44, exp: 99000 },
	{ level: 45, exp: 103500 },
	{ level: 46, exp: 108100 },
	{ level: 47, exp: 112800 },
	{ level: 48, exp: 117600 },
	{ level: 49, exp: 122500 },
	{ level: 50, exp: 127500 },
	{ level: 51, exp: 132600 },
	{ level: 52, exp: 137800 },
	{ level: 53, exp: 143100 },
	{ level: 54, exp: 148500 },
	{ level: 55, exp: 154000 },
	{ level: 56, exp: 159600 },
	{ level: 57, exp: 165300 },
	{ level: 58, exp: 171100 },
	{ level: 59, exp: 177000 },
	{ level: 60, exp: 183000 },
	{ level: 61, exp: 189100 },
	{ level: 62, exp: 195300 },
	{ level: 63, exp: 201600 },
	{ level: 64, exp: 208000 },
	{ level: 65, exp: 214500 },
	{ level: 66, exp: 221100 },
	{ level: 67, exp: 227800 },
	{ level: 68, exp: 234600 },
	{ level: 69, exp: 241500 },
	{ level: 70, exp: 248500 },
	{ level: 71, exp: 250100 },
	{ level: 72, exp: 251700 },
	{ level: 73, exp: 253300 },
	{ level: 74, exp: 254900 },
	{ level: 75, exp: 256500 },
	{ level: 76, exp: 257100 },
	{ level: 77, exp: 257700 },
	{ level: 78, exp: 258300 },
	{ level: 79, exp: 258900 },
	{ level: 80, exp: 259500 },
	{ level: 81, exp: 259600 },
	{ level: 82, exp: 259700 },
	{ level: 83, exp: 259800 },
	{ level: 84, exp: 259900 },
	{ level: 85, exp: 260000 },
	{ level: 86, exp: 260020 },
	{ level: 87, exp: 260040 },
	{ level: 88, exp: 260060 },
	{ level: 89, exp: 260080 },
	{ level: 90, exp: 260100 },
	{ level: 91, exp: 260110 },
	{ level: 92, exp: 260120 },
	{ level: 93, exp: 260130 },
	{ level: 94, exp: 260140 },
	{ level: 95, exp: 260150 },
	{ level: 96, exp: 260160 },
	{ level: 97, exp: 260170 },
	{ level: 98, exp: 260180 },
	{ level: 99, exp: 260190 },
	{ level: 100, exp: 260200 }
	// Level 101+: +5000 EXP per level until 999
];

// Stars table
const STARS_TABLE = [
	{ stars: 0, exp: 0, display: '<span style="font-size: 0.8em;">🌟</span>' },
	{ stars: 1, exp: 9700, display: '⭐' },
	{ stars: 2, exp: 33200, display: '⭐⭐' },
	{ stars: 3, exp: 93200, display: '⭐⭐⭐' },
	{ stars: 4, exp: 155200, display: '⭐⭐⭐⭐' },
	{ stars: 5, exp: 260200, display: '⭐⭐<span style="font-size: 1.3em;">🌟</span>⭐⭐' }
];

export default class LevelingPlugin extends Plugin {
	settings: LevelingPluginSettings;
	statusBarItem: HTMLElement;
	recalculateTimeout: NodeJS.Timeout | null = null;
	private markdownPostProcessors: Set<HTMLElement> = new Set();

	async onload() {
		await this.loadSettings();

		// Add status bar item
		this.statusBarItem = this.addStatusBarItem();
		this.updateStatusBar();

		// Add ribbon icon
		this.addRibbonIcon('trending-up', 'Calculate EXP', async () => {
			await this.calculateTotalExp(true); // Show notification when manually triggered
		});

		// Add command to recalculate EXP
		this.addCommand({
			id: 'recalculate-exp',
			name: 'Recalculate total EXP',
			callback: async () => {
				await this.calculateTotalExp(true); // Show notification when manually triggered
			}
		});

		// Add settings tab
		this.addSettingTab(new LevelingSettingTab(this.app, this));

		// Register markdown post processor to replace dynamic fields
		this.registerMarkdownPostProcessor((element, context) => {
			this.markdownPostProcessors.add(element);
			
			// Get current file frontmatter for skill context
			const file = this.app.workspace.getActiveFile();
			let skillContext: { type: string, category: string, name: string } | null = null;
			
			if (file) {
				const cache = this.app.metadataCache.getFileCache(file);
				if (cache?.frontmatter) {
					const fm = cache.frontmatter;
					if (fm.skill_type && fm.skill_category && fm.skill_name) {
						skillContext = {
							type: fm.skill_type,
							category: fm.skill_category,
							name: fm.skill_name
						};
					}
				}
			}
			
			this.replaceDynamicFields(element, skillContext);
			
			// Add event listeners for evolution chart buttons after processing
			setTimeout(() => {
				this.attachEvolutionChartListeners(element);
			}, 100);
		});

		// Calculate EXP when plugin loads
		await this.calculateTotalExp();

		// Register event to recalculate when files change
		this.registerEvent(
			this.app.vault.on('modify', async (file) => {
				if (file instanceof TFile) {
					await this.debouncedCalculateExp();
				}
			})
		);

		this.registerEvent(
			this.app.vault.on('create', async (file) => {
				if (file instanceof TFile) {
					await this.debouncedCalculateExp();
				}
			})
		);

		this.registerEvent(
			this.app.vault.on('delete', async (file) => {
				if (file instanceof TFile) {
					await this.debouncedCalculateExp();
				}
			})
		);

		// Also listen to metadata cache changes for immediate updates
		this.registerEvent(
			this.app.metadataCache.on('changed', async (file) => {
				if (file instanceof TFile) {
					await this.debouncedCalculateExp();
				}
			})
		);
	}

	async debouncedCalculateExp() {
		// Clear previous timeout
		if (this.recalculateTimeout) {
			clearTimeout(this.recalculateTimeout);
		}

		// Set new timeout to avoid recalculating too frequently
		this.recalculateTimeout = setTimeout(async () => {
			await this.calculateTotalExp();
		}, 500);
	}

	async calculateTotalExp(showNotification: boolean = false) {
		let totalExp = 0;
		const categoryTotals: { [key: string]: number } = {};
		const expHistory: { date: string; exp: number }[] = [];
		const attributeCounts: { [key: string]: number } = {};
		const wheelOfLifeCounts: { [key: string]: number } = {};
		const swotDataByDate: { date: string; data: { category: string; name: string; value: number }[] }[] = [];
		const skillsExp: { [type: string]: { [category: string]: { [skillName: string]: number } } } = {};
		
		// Initialize category totals
		EXP_CATEGORIES.forEach(cat => categoryTotals[cat] = 0);
		
		// Initialize attribute counts
		ATTRIBUTES.forEach(attr => attributeCounts[attr] = 0);
		
		// Initialize wheel of life counts
		WHEEL_OF_LIFE_AREAS.forEach(area => wheelOfLifeCounts[area] = 0);
		
		const files = this.app.vault.getMarkdownFiles();

		for (const file of files) {
			const cache = this.app.metadataCache.getFileCache(file);
			
			if (cache && cache.frontmatter) {
				const frontmatter = cache.frontmatter;
				
				let fileExp = 0;
				let fileHasAttributes = false;
				
				// Read SWOT data (format: "Strengths (name)": value) with date
				const fileSwotData: { category: string; name: string; value: number }[] = [];
				let fileHasSwotData = false;
				
				for (const key in frontmatter) {
					for (const swotCategory of SWOT_CATEGORIES) {
						// Check if key starts with SWOT category and has parentheses
						if (key.startsWith(swotCategory + ' (') && key.endsWith(')')) {
							// Extract name from parentheses
							const match = key.match(/\(([^)]+)\)/);
							if (match) {
								const name = match[1];
								const value = parseInt(frontmatter[key]);
								
								if (!isNaN(value) && value >= 1 && value <= 10) {
									fileSwotData.push({
										category: swotCategory,
										name: name,
										value: value
									});
									fileHasSwotData = true;
								}
							}
						}
					}
				}
				
				// If this file has SWOT data and a date, store it with the date
				if (fileHasSwotData) {
					const dateValue = frontmatter.date || frontmatter.Date;
					if (dateValue) {
						let dateStr = dateValue;
						
						// Handle different date formats
						if (typeof dateStr === 'string') {
							swotDataByDate.push({ date: dateStr, data: fileSwotData });
						} else if (dateStr instanceof Date) {
							swotDataByDate.push({ date: dateStr.toISOString().split('T')[0], data: fileSwotData });
						}
					}
				}
				
				// Read each EXP category from frontmatter (with alias support)
				for (const category of EXP_CATEGORIES) {
					// Check for direct category name first
					if (frontmatter[category]) {
						let value = parseInt(frontmatter[category]);
						
						// Validate value
						if (!isNaN(value) && value > 0) {
							// Cap at maximum points
							value = Math.min(value, MAX_POINTS_PER_CATEGORY);
							const expAmount = value * EXP_PER_POINT;
							totalExp += expAmount;
							fileExp += expAmount;
							categoryTotals[category] += expAmount;
						}
					}
					
					// Check for alias patterns like "Tasks (Intel)", "Missions (Physical)", etc.
					for (const attr of ATTRIBUTES) {
						const aliasKey = `${category} (${attr})`;
						if (frontmatter[aliasKey]) {
							let value = parseInt(frontmatter[aliasKey]);
							
							// Validate value
							if (!isNaN(value) && value > 0) {
								// Cap at maximum points
								value = Math.min(value, MAX_POINTS_PER_CATEGORY);
								const expAmount = value * EXP_PER_POINT;
								totalExp += expAmount;
								fileExp += expAmount;
								categoryTotals[category] += expAmount;
								
								// Mark that this file has this attribute
								fileHasAttributes = true;
							}
						}
					}
					
					// Check for wheel of life alias patterns like "Missions (Spirituality)", "Tasks (Emotions)", etc.
					// Use WHEEL_OF_LIFE_ALIASES keys for frontmatter, but store in display names
					for (const [alias, displayName] of Object.entries(WHEEL_OF_LIFE_ALIASES)) {
						const aliasKey = `${category} (${alias})`;
						if (frontmatter[aliasKey]) {
							let value = parseInt(frontmatter[aliasKey]);
							
							// Validate value
							if (!isNaN(value) && value > 0) {
								// Cap at maximum points
								value = Math.min(value, MAX_POINTS_PER_CATEGORY);
								const expAmount = value * EXP_PER_POINT;
								totalExp += expAmount;
								fileExp += expAmount;
								categoryTotals[category] += expAmount;
								
								// Mark that this file has this area
								fileHasAttributes = true;
							}
						}
					}
				}
				
				// Check for skill patterns like "Missions (Soft:Communication)" or "Missions (Soft_Leadership:Communication)"
				for (const category of EXP_CATEGORIES) {
					for (const skillType of SKILL_TYPES) {
						// Look for pattern: "Category (SkillType:SkillName)" or "Category (SkillType_Category:SkillName)"
						for (const key in frontmatter) {
							const pattern = new RegExp(`^${category}\\s*\\(${skillType}(?:_([^:]+))?:(.+)\\)$`);
							const match = key.match(pattern);
							
							if (match) {
								console.log('🎯 Skill detectada:', key, 'Match:', match);
								const skillCategory = match[1] ? match[1].trim() : 'Uncategorized';
								const skillName = match[2].trim();
								let value = parseInt(frontmatter[key]);
								
								console.log('📊 Processando skill:', {
									type: skillType,
									category: skillCategory,
									name: skillName,
									value: value
								});
								
								// Validate value
								if (!isNaN(value) && value > 0) {
									// Cap at maximum points
									value = Math.min(value, MAX_POINTS_PER_CATEGORY);
									const expAmount = value * EXP_PER_POINT;
									totalExp += expAmount;
									fileExp += expAmount;
									categoryTotals[category] += expAmount;
									
									// Store skill EXP with category
									if (!skillsExp[skillType]) {
										skillsExp[skillType] = {};
									}
									if (!skillsExp[skillType][skillCategory]) {
										skillsExp[skillType][skillCategory] = {};
									}
									if (!skillsExp[skillType][skillCategory][skillName]) {
										skillsExp[skillType][skillCategory][skillName] = 0;
									}
									skillsExp[skillType][skillCategory][skillName] += expAmount;
								}
							}
						}
					}
				}
				
				// Count attributes for radar chart (add EXP, not note count)
				if (fileHasAttributes) {
					for (const category of EXP_CATEGORIES) {
						for (const attr of ATTRIBUTES) {
							const aliasKey = `${category} (${attr})`;
							if (frontmatter[aliasKey]) {
								const value = parseInt(frontmatter[aliasKey]);
								if (!isNaN(value) && value > 0) {
									// Add the EXP value to the attribute's EXP count
									const cappedValue = Math.min(value, MAX_POINTS_PER_CATEGORY);
									attributeCounts[attr] = (attributeCounts[attr] || 0) + (cappedValue * EXP_PER_POINT);
								}
							}
						}
						
						// Also count wheel of life areas (using aliases from frontmatter)
						for (const [alias, displayName] of Object.entries(WHEEL_OF_LIFE_ALIASES)) {
							const aliasKey = `${category} (${alias})`;
							if (frontmatter[aliasKey]) {
								const value = parseInt(frontmatter[aliasKey]);
								if (!isNaN(value) && value > 0) {
									// Add the value to the area's EXP count (store using display name)
									wheelOfLifeCounts[displayName] = (wheelOfLifeCounts[displayName] || 0) + (value * EXP_PER_POINT);
								}
							}
						}
					}
				}
				
				// Track EXP with date if file has a date property
				// Check for 'date', 'Date', or any case variation
				const dateValue = frontmatter.date || frontmatter.Date;
				if (fileExp > 0 && dateValue) {
					let dateStr = dateValue;
					
					// Handle different date formats
					if (typeof dateStr === 'string') {
						expHistory.push({ date: dateStr, exp: fileExp });
					} else if (dateStr instanceof Date) {
						expHistory.push({ date: dateStr.toISOString().split('T')[0], exp: fileExp });
					}
				}
			}
		}

		this.settings.totalExp = totalExp;
		this.settings.currentLevel = this.calculateLevel(totalExp);
		
		// Get SWOT data from the most recent note
		let latestSwotData: { category: string; name: string; value: number }[] = [];
		if (swotDataByDate.length > 0) {
			// Sort by date (most recent first)
			swotDataByDate.sort((a, b) => {
				const dateA = new Date(a.date).getTime();
				const dateB = new Date(b.date).getTime();
				return dateB - dateA; // Descending order (newest first)
			});
			
			// Get data from the most recent date
			latestSwotData = swotDataByDate[0].data;
		}
		
		// Store category totals, history, attribute counts, wheel of life counts, SWOT data, and skills in settings
		(this.settings as any).categoryTotals = categoryTotals;
		(this.settings as any).expHistory = expHistory;
		(this.settings as any).attributeCounts = attributeCounts;
		(this.settings as any).wheelOfLifeCounts = wheelOfLifeCounts;
		(this.settings as any).swotData = latestSwotData;
		(this.settings as any).swotLatestDate = swotDataByDate.length > 0 ? swotDataByDate[0].date : null;
		(this.settings as any).skillsExp = skillsExp;
		
		console.log('💾 Skills salvas:', JSON.stringify(skillsExp, null, 2));
		
		await this.saveSettings();
		this.updateStatusBar();

		// Update all dynamic fields in real-time
		this.updateAllDynamicFields();

		// Only show notification if explicitly requested
		if (showNotification) {
			const level = this.calculateLevel(totalExp);
			const rank = this.calculateRank(totalExp);
			new Notice(`Total EXP: ${totalExp} | Level: ${level} | Rank: ${rank}`);
		}
	}

	updateAllDynamicFields() {
		// Force re-render of all registered markdown post processors
		this.markdownPostProcessors.forEach(element => {
			if (element.isConnected) {
				this.replaceDynamicFields(element);
				// Re-attach event listeners after updating
				setTimeout(() => {
					this.attachEvolutionChartListeners(element);
				}, 100);
			} else {
				// Remove disconnected elements
				this.markdownPostProcessors.delete(element);
			}
		});
	}

	calculateLevel(exp: number): number {
		// Maximum level is 999
		const MAX_LEVEL = 999;
		
		// Check if we're in the table range (level 0-100)
		for (let i = LEVEL_TABLE.length - 1; i >= 0; i--) {
			if (exp >= LEVEL_TABLE[i].exp) {
				// If we're at level 100, calculate levels above it
				if (LEVEL_TABLE[i].level === 100) {
					const expAbove100 = exp - LEVEL_TABLE[i].exp;
					const levelsAbove100 = Math.floor(expAbove100 / 5000);
					const calculatedLevel = 100 + levelsAbove100;
					// Cap at level 999
					return Math.min(calculatedLevel, MAX_LEVEL);
				}
				
				// For exact matches in the table, return the level directly
				return LEVEL_TABLE[i].level;
			}
		}
		return 0; // Default to level 0
	}

	calculateRank(exp: number): string {
		// Find the appropriate rank based on the rank table
		for (let i = RANK_TABLE.length - 1; i >= 0; i--) {
			if (exp >= RANK_TABLE[i].exp) {
				return RANK_TABLE[i].rank;
			}
		}
		return 'F'; // Default to F
	}

	calculateStars(exp: number): string {
		// Find the appropriate stars based on the stars table
		for (let i = STARS_TABLE.length - 1; i >= 0; i--) {
			if (exp >= STARS_TABLE[i].exp) {
				return STARS_TABLE[i].display;
			}
		}
		return '<span style="font-size: 0.8em;">🌟</span>'; // Default to 0 stars
	}

	updateStatusBar() {
		const level = this.calculateLevel(this.settings.totalExp);
		const rank = this.calculateRank(this.settings.totalExp);
		this.statusBarItem.setText(`⚡ Level ${level} | Rank ${rank} | EXP: ${this.settings.totalExp}`);
	}

	replaceDynamicFields(element: HTMLElement, skillContext?: { type: string, category: string, name: string } | null) {
		// Get current values
		const totalExp = this.settings.totalExp.toString();
		const level = this.calculateLevel(this.settings.totalExp).toString();
		const rank = this.calculateRank(this.settings.totalExp);
		const stars = this.calculateStars(this.settings.totalExp);
		const expChart = this.generateExpChart();
		const evolutionChart = this.generateEvolutionChart();
		const radarChart = this.generateRadarChart();
		const wheelOfLifeChart = this.generateWheelOfLifeChart();
		const swotRadarChart = this.generateSwotRadarChart();
		const swotRadarChart2 = this.generateSwotRadarChart2();
		
		// Get skill-specific values if in skill context
		let skillExp = 0;
		let skillRank = 'F';
		let skillLevel = '0';
		
		if (skillContext) {
			const skillsExp = (this.settings as any).skillsExp || {};
			if (skillsExp[skillContext.type] && skillsExp[skillContext.type][skillContext.category]) {
				skillExp = skillsExp[skillContext.type][skillContext.category][skillContext.name] || 0;
				skillRank = this.calculateRank(skillExp);
				skillLevel = this.calculateLevel(skillExp).toString();
			}
		}

		// Find all elements with our custom data attribute and update them
		const processedElements = element.querySelectorAll('[data-leveling-field]');
		processedElements.forEach(el => {
			const fieldType = el.getAttribute('data-leveling-field');
			let newContent = '';
			
			if (fieldType === 'total_exp') {
				newContent = `<strong style="color: #f4c542;">${totalExp}</strong>`;
			} else if (fieldType === 'level') {
				newContent = `<strong style="color: #f4c542;">${level}</strong>`;
			} else if (fieldType === 'rank') {
				newContent = `<strong style="color: #f4c542;">${rank}</strong>`;
			} else if (fieldType === 'skill_exp') {
				// Auto-detect skill context
				newContent = `<strong style="color: #f4c542;">${skillExp}</strong>`;
			} else if (fieldType === 'skill_rank') {
				// Auto-detect skill context
				newContent = `<strong style="color: #f4c542;">${skillRank}</strong>`;
			} else if (fieldType === 'skill_level') {
				// Auto-detect skill context
				newContent = `<strong style="color: #f4c542;">${skillLevel}</strong>`;
			} else if (fieldType === 'stars') {
				newContent = stars;
			} else if (fieldType === 'exp_type_chart') {
				newContent = expChart;
			} else if (fieldType === 'exp_evolution_chart') {
				newContent = evolutionChart;
			} else if (fieldType === 'radar_chart') {
				newContent = radarChart;
			} else if (fieldType === 'wheel_of_life_chart') {
				newContent = wheelOfLifeChart;
			} else if (fieldType === 'swot_radar_chart') {
				newContent = swotRadarChart;
			} else if (fieldType === 'swot_radar_chart2') {
				newContent = swotRadarChart2;
			} else if (fieldType === 'all_skills_grid' || fieldType === 'all_skills_grid_rank' || fieldType === 'all_skills_grid_exp' || fieldType === 'all_skills_grid_rank_exp') {
				// Handle all skills grid
				const includeRank = fieldType.includes('_rank');
				const includeExp = fieldType.includes('_exp');
				newContent = this.generateAllSkillsGrid(includeRank, includeExp);
			} else if (fieldType && fieldType.match(/^(soft|hard|power|perk)_skill_list_\w+(_rank)?(_exp)?$/i)) {
				// Handle skill list by category: soft_skill_list_leadership_rank_exp
				const match = fieldType.match(/^(\w+)_skill_list_(\w+)(_rank)?(_exp)?$/i);
				if (match) {
					const skillType = match[1].charAt(0).toUpperCase() + match[1].slice(1);
					const category = match[2].split('_').map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
					const includeRank = !!match[3];
					const includeExp = !!match[4];
					newContent = this.generateSkillListByCategory(skillType, category, includeRank, includeExp);
				}
			} else if (fieldType && fieldType.match(/^(soft|hard|power|perk)_skill_list(_rank)?(_exp)?$/i)) {
				// Handle skill list placeholders
				const match = fieldType.match(/^(\w+)_skill_list(_rank)?(_exp)?$/i);
				if (match) {
					const skillType = match[1].charAt(0).toUpperCase() + match[1].slice(1);
					const includeRank = !!match[2];
					const includeExp = !!match[3];
					newContent = this.generateSkillList(skillType, includeRank, includeExp);
				}
			} else if (fieldType && fieldType.includes('_skill_')) {
				// Handle dynamic skill placeholders like "soft_skill_communication_rank" or "hard_skill_programming_exp"
				const parts = fieldType.split('_');
				if (parts.length >= 4) {
					const skillType = parts[0].charAt(0).toUpperCase() + parts[0].slice(1); // Capitalize: soft -> Soft
					const metric = parts[parts.length - 1]; // rank or exp
					const skillName = parts.slice(2, -1).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' '); // communication -> Communication
					
					const skillsExp = (this.settings as any).skillsExp || {};
					
					// Sum EXP across all categories for this skill
					let exp = 0;
					if (skillsExp[skillType]) {
						for (const category in skillsExp[skillType]) {
							if (skillsExp[skillType][category][skillName]) {
								exp += skillsExp[skillType][category][skillName];
							}
						}
					}
					
					if (metric === 'rank') {
						const rank = this.calculateRank(exp);
						newContent = `<strong style="color: #f4c542;">${rank}</strong>`;
					} else if (metric === 'exp') {
						newContent = `<strong style="color: #f4c542;">${exp}</strong>`;
					}
				}
			}
			
			// Only update if content changed
			if (newContent && el.innerHTML !== newContent) {
				el.innerHTML = newContent;
			}
		});

		// Walk through all text nodes to find and replace placeholders
		const walker = document.createTreeWalker(
			element,
			NodeFilter.SHOW_TEXT,
			null
		);

		const nodesToReplace: { node: Node; parent: Node }[] = [];

		let node: Node | null;
		while ((node = walker.nextNode())) {
			const textNode = node as Text;
			const text = textNode.textContent || '';
			
			// Skip if already processed
			if (textNode.parentElement?.hasAttribute('data-leveling-field')) {
				continue;
			}
			
			// Skip if inside a code block (``` ``` blocks or inline code ``)
			let parent = textNode.parentElement;
			let insideCodeBlock = false;
			while (parent) {
				if (parent.tagName === 'PRE' || parent.tagName === 'CODE') {
					insideCodeBlock = true;
					break;
				}
				parent = parent.parentElement;
			}
			
			if (insideCodeBlock) {
				continue;
			}
			
			// Check if this text node contains any of our placeholders
			const hasSkillPlaceholder = /{(soft|hard|power|perk)_skill_\w+_(rank|exp)}/i.test(text);
			const hasSkillListPlaceholder = /{(soft|hard|power|perk)_skill_list(_\w+)?(_rank)?(_exp)?}/i.test(text);
			const hasAllSkillsGrid = /{all_skills_grid(_rank)?(_exp)?}/i.test(text);
			
			if (text.includes('{total_exp}') || text.includes('{level}') || 
			    text.includes('{rank}') || text.includes('{stars}') || 
			    text.includes('{skill_exp}') || text.includes('{skill_rank}') || text.includes('{skill_level}') ||
			    text.includes('{exp_type_chart}') || text.includes('{exp_evolution_chart}') ||
			    text.includes('{radar_chart}') || text.includes('{wheel_of_life_chart}') ||
			    text.includes('{swot_radar_chart}') || text.includes('{swot_radar_chart2}') ||
			    hasSkillPlaceholder || hasSkillListPlaceholder || hasAllSkillsGrid) {
				nodesToReplace.push({ node: textNode, parent: textNode.parentNode! });
			}
		}

		// Apply replacements
		nodesToReplace.forEach(({ node, parent }) => {
			const text = node.textContent || '';
			
			// Handle {stars}, {exp_type_chart}, {exp_evolution_chart}, {radar_chart}, {wheel_of_life_chart}, {swot_radar_chart}, {swot_radar_chart2}, and skill lists separately because they contain HTML
			const hasHtmlPlaceholder = text.includes('{stars}') || text.includes('{exp_type_chart}') || 
			                           text.includes('{exp_evolution_chart}') || text.includes('{radar_chart}') || 
			                           text.includes('{wheel_of_life_chart}') || text.includes('{swot_radar_chart}') || 
			                           text.includes('{swot_radar_chart2}') || 
			                           /{(soft|hard|power|perk)_skill_list(_\w+)?(_rank)?(_exp)?}/i.test(text) ||
			                           /{all_skills_grid(_rank)?(_exp)?}/i.test(text);
			
			if (hasHtmlPlaceholder) {
				const parts = text.split(/(\{total_exp\}|\{level\}|\{rank\}|\{skill_exp\}|\{skill_rank\}|\{skill_level\}|\{stars\}|\{exp_type_chart\}|\{exp_evolution_chart\}|\{radar_chart\}|\{wheel_of_life_chart\}|\{swot_radar_chart\}|\{swot_radar_chart2\}|\{all_skills_grid(?:_rank)?(?:_exp)?\}|\{(?:soft|hard|power|perk)_skill_list(?:_\w+)?(?:_rank)?(?:_exp)?\}|\{(?:soft|hard|power|perk)_skill_\w+_(?:rank|exp)\})/gi);
				
				// Clear the current node
				parent.removeChild(node);
				
				// Insert text and replacements
				parts.forEach(part => {
					if (part === '{total_exp}') {
						const span = document.createElement('span');
						span.setAttribute('data-leveling-field', 'total_exp');
						span.innerHTML = `<strong style="color: #f4c542;">${totalExp}</strong>`;
						parent.appendChild(span);
					} else if (part === '{level}') {
						const span = document.createElement('span');
						span.setAttribute('data-leveling-field', 'level');
						span.innerHTML = `<strong style="color: #f4c542;">${level}</strong>`;
						parent.appendChild(span);
					} else if (part === '{rank}') {
						const span = document.createElement('span');
						span.setAttribute('data-leveling-field', 'rank');
						span.innerHTML = `<strong style="color: #f4c542;">${rank}</strong>`;
						parent.appendChild(span);
					} else if (part === '{skill_exp}') {
						const span = document.createElement('span');
						span.setAttribute('data-leveling-field', 'skill_exp');
						span.innerHTML = `<strong style="color: #f4c542;">${skillExp}</strong>`;
						parent.appendChild(span);
					} else if (part === '{skill_rank}') {
						const span = document.createElement('span');
						span.setAttribute('data-leveling-field', 'skill_rank');
						span.innerHTML = `<strong style="color: #f4c542;">${skillRank}</strong>`;
						parent.appendChild(span);
					} else if (part === '{skill_level}') {
						const span = document.createElement('span');
						span.setAttribute('data-leveling-field', 'skill_level');
						span.innerHTML = `<strong style="color: #f4c542;">${skillLevel}</strong>`;
						parent.appendChild(span);
					} else if (part === '{stars}') {
						const span = document.createElement('span');
						span.setAttribute('data-leveling-field', 'stars');
						span.innerHTML = stars;
						parent.appendChild(span);
					} else if (part === '{exp_type_chart}') {
						const span = document.createElement('span');
						span.setAttribute('data-leveling-field', 'exp_type_chart');
						span.innerHTML = expChart;
						parent.appendChild(span);
					} else if (part === '{exp_evolution_chart}') {
						const span = document.createElement('span');
						span.setAttribute('data-leveling-field', 'exp_evolution_chart');
						span.innerHTML = evolutionChart;
						parent.appendChild(span);
					} else if (part === '{radar_chart}') {
						const span = document.createElement('span');
						span.setAttribute('data-leveling-field', 'radar_chart');
						span.innerHTML = radarChart;
						parent.appendChild(span);
					} else if (part === '{wheel_of_life_chart}') {
						const span = document.createElement('span');
						span.setAttribute('data-leveling-field', 'wheel_of_life_chart');
						span.innerHTML = wheelOfLifeChart;
						parent.appendChild(span);
					} else if (part === '{swot_radar_chart}') {
						const span = document.createElement('span');
						span.setAttribute('data-leveling-field', 'swot_radar_chart');
						span.innerHTML = swotRadarChart;
						parent.appendChild(span);
					} else if (part === '{swot_radar_chart2}') {
						const span = document.createElement('span');
						span.setAttribute('data-leveling-field', 'swot_radar_chart2');
						span.innerHTML = swotRadarChart2;
						parent.appendChild(span);
					} else if (part.match(/{all_skills_grid(_rank)?(_exp)?}/i)) {
						// Handle all skills grid
						const match = part.match(/{all_skills_grid(_rank)?(_exp)?}/i);
						if (match) {
							const includeRank = !!match[1];
							const includeExp = !!match[2];
							
							const span = document.createElement('span');
							span.setAttribute('data-leveling-field', part.slice(1, -1));
							span.innerHTML = this.generateAllSkillsGrid(includeRank, includeExp);
							parent.appendChild(span);
						}
					} else if (part.match(/{(soft|hard|power|perk)_skill_list_\w+(_rank)?(_exp)?}/i)) {
						// Handle skill list by category
						const match = part.match(/{(\w+)_skill_list_(\w+)(_rank)?(_exp)?}/i);
						if (match) {
							const skillType = match[1].charAt(0).toUpperCase() + match[1].slice(1);
							const category = match[2].split('_').map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
							const includeRank = !!match[3];
							const includeExp = !!match[4];
							
							const span = document.createElement('span');
							span.setAttribute('data-leveling-field', part.slice(1, -1));
							span.innerHTML = this.generateSkillListByCategory(skillType, category, includeRank, includeExp);
							parent.appendChild(span);
						}
					} else if (part.match(/{(soft|hard|power|perk)_skill_list(_rank)?(_exp)?}/i)) {
						// Handle skill list placeholders
						const match = part.match(/{(\w+)_skill_list(_rank)?(_exp)?}/i);
						if (match) {
							const skillType = match[1].charAt(0).toUpperCase() + match[1].slice(1);
							const includeRank = !!match[2];
							const includeExp = !!match[3];
							
							const span = document.createElement('span');
							span.setAttribute('data-leveling-field', part.slice(1, -1));
							span.innerHTML = this.generateSkillList(skillType, includeRank, includeExp);
							parent.appendChild(span);
						}
					} else if (part.match(/{(soft|hard|power|perk)_skill_\w+_(rank|exp)}/i)) {
						// Handle dynamic skill placeholders
						const match = part.match(/{(\w+)_skill_(.+)_(rank|exp)}/i);
						if (match) {
							const skillType = match[1].charAt(0).toUpperCase() + match[1].slice(1);
							const skillNameParts = match[2].split('_').map(p => p.charAt(0).toUpperCase() + p.slice(1));
							const skillName = skillNameParts.join(' ');
							const metric = match[3];
							const skillsExp = (this.settings as any).skillsExp || {};
							
							// Sum EXP across all categories for this skill
							let exp = 0;
							if (skillsExp[skillType]) {
								for (const category in skillsExp[skillType]) {
									if (skillsExp[skillType][category][skillName]) {
										exp += skillsExp[skillType][category][skillName];
									}
								}
							}
							
							const span = document.createElement('span');
							span.setAttribute('data-leveling-field', part.slice(1, -1));
							
							if (metric === 'rank') {
								const rank = this.calculateRank(exp);
								span.innerHTML = `<strong style="color: #f4c542;">${rank}</strong>`;
							} else if (metric === 'exp') {
								span.innerHTML = `<strong style="color: #f4c542;">${exp}</strong>`;
							}
							parent.appendChild(span);
						}
					} else if (part) {
						parent.appendChild(document.createTextNode(part));
					}
				});
			} else {
				// Handle other placeholders
				const parts = text.split(/(\{total_exp\}|\{level\}|\{rank\}|\{skill_exp\}|\{skill_rank\}|\{skill_level\}|\{(?:soft|hard|power|perk)_skill_\w+_(?:rank|exp)\})/gi);
				
				parent.removeChild(node);
				
				parts.forEach(part => {
					if (part === '{total_exp}') {
						const span = document.createElement('span');
						span.setAttribute('data-leveling-field', 'total_exp');
						span.innerHTML = `<strong style="color: #f4c542;">${totalExp}</strong>`;
						parent.appendChild(span);
					} else if (part === '{level}') {
						const span = document.createElement('span');
						span.setAttribute('data-leveling-field', 'level');
						span.innerHTML = `<strong style="color: #f4c542;">${level}</strong>`;
						parent.appendChild(span);
					} else if (part === '{rank}') {
						const span = document.createElement('span');
						span.setAttribute('data-leveling-field', 'rank');
						span.innerHTML = `<strong style="color: #f4c542;">${rank}</strong>`;
						parent.appendChild(span);
					} else if (part === '{skill_exp}') {
						const span = document.createElement('span');
						span.setAttribute('data-leveling-field', 'skill_exp');
						span.innerHTML = `<strong style="color: #f4c542;">${skillExp}</strong>`;
						parent.appendChild(span);
					} else if (part === '{skill_rank}') {
						const span = document.createElement('span');
						span.setAttribute('data-leveling-field', 'skill_rank');
						span.innerHTML = `<strong style="color: #f4c542;">${skillRank}</strong>`;
						parent.appendChild(span);
					} else if (part === '{skill_level}') {
						const span = document.createElement('span');
						span.setAttribute('data-leveling-field', 'skill_level');
						span.innerHTML = `<strong style="color: #f4c542;">${skillLevel}</strong>`;
						parent.appendChild(span);
					} else if (part.match(/{(soft|hard|power|perk)_skill_\w+_(rank|exp)}/i)) {
						// Handle dynamic skill placeholders
						const match = part.match(/{(\w+)_skill_(.+)_(rank|exp)}/i);
						if (match) {
							const skillType = match[1].charAt(0).toUpperCase() + match[1].slice(1);
							const skillNameParts = match[2].split('_').map(p => p.charAt(0).toUpperCase() + p.slice(1));
							const skillName = skillNameParts.join(' ');
							const metric = match[3];
							const skillsExp = (this.settings as any).skillsExp || {};
							
							// Sum EXP across all categories for this skill
							let exp = 0;
							if (skillsExp[skillType]) {
								for (const category in skillsExp[skillType]) {
									if (skillsExp[skillType][category][skillName]) {
										exp += skillsExp[skillType][category][skillName];
									}
								}
							}
							
							const span = document.createElement('span');
							span.setAttribute('data-leveling-field', part.slice(1, -1));
							
							if (metric === 'rank') {
								const rank = this.calculateRank(exp);
								span.innerHTML = `<strong style="color: #f4c542;">${rank}</strong>`;
							} else if (metric === 'exp') {
								span.innerHTML = `<strong style="color: #f4c542;">${exp}</strong>`;
							}
							parent.appendChild(span);
						}
					} else if (part) {
						parent.appendChild(document.createTextNode(part));
					}
				});
			}
		});
	}

	generateSkillList(skillType: string, includeRank: boolean = false, includeExp: boolean = false): string {
		const skillsExp = (this.settings as any).skillsExp || {};
		const typeData = skillsExp[skillType];
		
		if (!typeData || Object.keys(typeData).length === 0) {
			return `<div style="color: #888;">Nenhuma skill ${skillType} ainda</div>`;
		}
		
		let html = '<ul style="line-height: 1.8; list-style-type: disc; padding-left: 20px;">';
		
		// Sort categories alphabetically
		const categories = Object.keys(typeData).sort();
		
		for (const category of categories) {
			const skills = typeData[category];
			const emoji = SKILL_TYPE_EMOJIS[skillType] || '📌';
			
			// Category as main bullet
			html += `<li style="margin-bottom: 10px;">`;
			html += `<strong style="color: #4ecdc4; font-size: 1.1em;">${emoji} ${category}</strong>`;
			html += `<ul style="margin: 5px 0; padding-left: 20px; list-style-type: circle;">`;
			
			// Sort skills alphabetically
			const skillNames = Object.keys(skills).sort();
			
			for (const skillName of skillNames) {
				const exp = skills[skillName];
				const rank = this.calculateRank(exp);
				
				console.log(`Skill: ${skillName}, EXP: ${exp}, Rank: ${rank}`);
				
				// Find note with matching skill metadata
				let linkedFile: string | null = null;
				const files = this.app.vault.getMarkdownFiles();
				
				for (const file of files) {
					const cache = this.app.metadataCache.getFileCache(file);
					if (cache?.frontmatter) {
						const fm = cache.frontmatter;
						if (fm.skill_type === skillType && 
						    fm.skill_category === category && 
						    fm.skill_name === skillName) {
							linkedFile = file.basename; // Nome sem extensão
							break;
						}
					}
				}
				
				html += `<li>`;
				
				// Create link if matching note found (with bold)
				if (linkedFile) {
					html += `<strong><a href="#" class="internal-link" data-href="${linkedFile}">${skillName}</a></strong>`;
				} else {
					html += `<span>${skillName}</span>`;
				}
				
				if (includeRank) {
					html += ` <span style="color: #f4c542; font-weight: bold;">[${rank}]</span>`;
				}
				
				if (includeExp) {
					html += ` <span style="color: #f4c542; font-weight: bold;">(${exp} EXP)</span>`;
				}
				
				html += `</li>`;
			}
			
			html += `</ul></li>`;
		}
		
		html += '</ul>';
		return html;
	}

	generateSkillListByCategory(skillType: string, categoryName: string, includeRank: boolean = false, includeExp: boolean = false): string {
		const skillsExp = (this.settings as any).skillsExp || {};
		const typeData = skillsExp[skillType];
		
		if (!typeData || !typeData[categoryName]) {
			return `<div style="color: #888;">Nenhuma skill ${skillType} na categoria ${categoryName} ainda</div>`;
		}
		
		const skills = typeData[categoryName];
		const emoji = SKILL_TYPE_EMOJIS[skillType] || '📌';
		
		let html = '<ul style="line-height: 1.8; list-style-type: disc; padding-left: 20px;">';
		html += `<li style="margin-bottom: 10px;">`;
		html += `<strong style="color: #4ecdc4; font-size: 1.1em;">${emoji} ${categoryName}</strong>`;
		html += `<ul style="margin: 5px 0; padding-left: 20px; list-style-type: circle;">`;
		
		const skillNames = Object.keys(skills).sort();
		
		for (const skillName of skillNames) {
			const exp = skills[skillName];
			const rank = this.calculateRank(exp);
			
			// Find note with matching skill metadata
			let linkedFile: string | null = null;
			const files = this.app.vault.getMarkdownFiles();
			
			for (const file of files) {
				const cache = this.app.metadataCache.getFileCache(file);
				if (cache?.frontmatter) {
					const fm = cache.frontmatter;
					if (fm.skill_type === skillType && 
					    fm.skill_category === categoryName && 
					    fm.skill_name === skillName) {
						linkedFile = file.basename;
						break;
					}
				}
			}
			
			html += `<li>`;
			
			if (linkedFile) {
				html += `<strong><a href="#" class="internal-link" data-href="${linkedFile}">${skillName}</a></strong>`;
			} else {
				html += `<span>${skillName}</span>`;
			}
			
			if (includeRank) {
				html += ` <span style="color: #f4c542; font-weight: bold;">[${rank}]</span>`;
			}
			
			if (includeExp) {
				html += ` <span style="color: #f4c542; font-weight: bold;">(${exp} EXP)</span>`;
			}
			
			html += `</li>`;
		}
		
		html += `</ul></li></ul>`;
		return html;
	}

	generateAllSkillsGrid(includeRank: boolean = false, includeExp: boolean = false): string {
		const skillsExp = (this.settings as any).skillsExp || {};
		
		// Check if there are any skills
		const hasSkills = SKILL_TYPES.some(type => skillsExp[type] && Object.keys(skillsExp[type]).length > 0);
		
		if (!hasSkills) {
			return '<div style="color: #888;">Nenhuma skill ainda</div>';
		}
		
		let html = '<div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0;">';
		
		for (const skillType of SKILL_TYPES) {
			const typeData = skillsExp[skillType];
			const emoji = SKILL_TYPE_EMOJIS[skillType] || '📌';
			
			html += `<div style="min-width: 0;">`;
			html += `<h3 style="color: #4ecdc4; margin-bottom: 10px;">${emoji} ${skillType}</h3>`;
			
			if (!typeData || Object.keys(typeData).length === 0) {
				html += `<div style="color: #888; font-size: 0.9em;">Nenhuma ainda</div>`;
			} else {
				html += `<ul style="line-height: 1.6; list-style-type: disc; padding-left: 20px; font-size: 0.95em;">`;
				
				const categories = Object.keys(typeData).sort();
				
				for (const category of categories) {
					const skills = typeData[category];
					
					html += `<li style="margin-bottom: 8px;">`;
					html += `<strong style="color: #95e1d3;">${category}</strong>`;
					html += `<ul style="margin: 3px 0; padding-left: 15px; list-style-type: circle;">`;
					
					const skillNames = Object.keys(skills).sort();
					
					for (const skillName of skillNames) {
						const exp = skills[skillName];
						const rank = this.calculateRank(exp);
						
						// Find note
						let linkedFile: string | null = null;
						const files = this.app.vault.getMarkdownFiles();
						
						for (const file of files) {
							const cache = this.app.metadataCache.getFileCache(file);
							if (cache?.frontmatter) {
								const fm = cache.frontmatter;
								if (fm.skill_type === skillType && 
								    fm.skill_category === category && 
								    fm.skill_name === skillName) {
									linkedFile = file.basename;
									break;
								}
							}
						}
						
						html += `<li style="font-size: 0.9em;">`;
						
						if (linkedFile) {
							html += `<strong><a href="#" class="internal-link" data-href="${linkedFile}">${skillName}</a></strong>`;
						} else {
							html += `<span>${skillName}</span>`;
						}
						
						if (includeRank) {
							html += ` <span style="color: #f4c542; font-weight: bold; font-size: 0.85em;">[${rank}]</span>`;
						}
						
						if (includeExp) {
							html += ` <span style="color: #f4c542; font-weight: bold; font-size: 0.85em;">(${exp})</span>`;
						}
						
						html += `</li>`;
					}
					
					html += `</ul></li>`;
				}
				
				html += `</ul>`;
			}
			
			html += `</div>`;
		}
		
		html += '</div>';
		return html;
	}

	generateExpChart(): string {
		const categoryTotals = (this.settings as any).categoryTotals || {};
		const totalExp = this.settings.totalExp;
		
		if (totalExp === 0) {
			return '<div style="text-align: center; color: #888;">Nenhum EXP ainda</div>';
		}

		// Colors for each category
		const colors: { [key: string]: string } = {
			'Tasks': '#ff6b6b',
			'Missions': '#4ecdc4',
			'Exploration': '#45b7d1',
			'Training': '#f9ca24',
			'Battles': '#ee5a6f',
			'Crafting': '#95e1d3'
		};

		// Generate unique ID for this chart instance
		const chartId = 'exp-chart-' + Math.random().toString(36).substr(2, 9);

		// Calculate percentages and generate chart
		let html = '<div style="display: flex; flex-direction: column; align-items: center; gap: 15px; margin: 20px 0;">';
		
		// SVG Pie Chart (600x600)
		html += `<svg width="600" height="600" viewBox="0 0 600 600" style="cursor: pointer;" onclick="document.getElementById('${chartId}').style.display = document.getElementById('${chartId}').style.display === 'none' ? 'flex' : 'none';">`;
		
		// Count how many categories have EXP
		const categoriesWithExp = EXP_CATEGORIES.filter(cat => (categoryTotals[cat] || 0) > 0);
		
		// If only one category, draw a full circle with label
		if (categoriesWithExp.length === 1) {
			const category = categoriesWithExp[0];
			const emoji = CATEGORY_EMOJIS[category] || '';
			html += `<circle cx="300" cy="300" r="270" fill="${colors[category]}" stroke="#ffffff" stroke-width="6"/>`;
			html += `<text x="300" y="285" text-anchor="middle" fill="#ffffff" font-size="48" font-weight="bold">${emoji} ${category}</text>`;
			html += `<text x="300" y="335" text-anchor="middle" fill="#ffffff" font-size="40" font-weight="bold">100%</text>`;
		} else {
			// Multiple categories - draw pie slices with labels
			let currentAngle = 0;
			
			// First pass: draw slices
			EXP_CATEGORIES.forEach(category => {
				const exp = categoryTotals[category] || 0;
				const percentage = (exp / totalExp) * 100;
				const angle = (percentage / 100) * 360;
				
				if (exp > 0) {
					// Calculate arc path
					const startAngle = currentAngle * (Math.PI / 180);
					const endAngle = (currentAngle + angle) * (Math.PI / 180);
					
					const startX = 300 + 270 * Math.cos(startAngle);
					const startY = 300 + 270 * Math.sin(startAngle);
					const endX = 300 + 270 * Math.cos(endAngle);
					const endY = 300 + 270 * Math.sin(endAngle);
					
					const largeArcFlag = angle > 180 ? 1 : 0;
					
					const pathData = [
						`M 300 300`,
						`L ${startX} ${startY}`,
						`A 270 270 0 ${largeArcFlag} 1 ${endX} ${endY}`,
						`Z`
					].join(' ');
					
					html += `<path d="${pathData}" fill="${colors[category]}" stroke="#ffffff" stroke-width="6"/>`;
					
					currentAngle += angle;
				}
			});
			
			// Second pass: draw labels
			currentAngle = 0;
			EXP_CATEGORIES.forEach(category => {
				const exp = categoryTotals[category] || 0;
				const percentage = (exp / totalExp) * 100;
				const angle = (percentage / 100) * 360;
				
				if (exp > 0 && percentage > 5) { // Only show label if slice is big enough
					// Calculate label position (middle of the slice, 60% from center)
					const middleAngle = (currentAngle + angle / 2) * (Math.PI / 180);
					const labelX = 300 + 150 * Math.cos(middleAngle);
					const labelY = 300 + 150 * Math.sin(middleAngle);
					
					const emoji = CATEGORY_EMOJIS[category] || '';
					
					// Add text with shadow for readability
					html += `<text x="${labelX}" y="${labelY - 10}" text-anchor="middle" fill="#ffffff" font-size="36" font-weight="bold" style="text-shadow: 2px 2px 5px rgba(0,0,0,0.7);">${emoji}</text>`;
					html += `<text x="${labelX}" y="${labelY + 25}" text-anchor="middle" fill="#ffffff" font-size="28" font-weight="bold" style="text-shadow: 2px 2px 5px rgba(0,0,0,0.7);">${percentage.toFixed(1)}%</text>`;
					
					currentAngle += angle;
				} else if (exp > 0) {
					currentAngle += angle;
				}
			});
		}
		
		html += '</svg>';
		
		// Collapsible Legend (visible by default, hidden when clicked) - 2 vertical columns with 3 items each
		html += `<div id="${chartId}" style="display: flex; flex-direction: row; gap: 20px; font-size: 16px; width: 100%; max-width: 700px; justify-content: center;">`;
		
		// Left column
		html += `<div style="display: flex; flex-direction: column; gap: 10px; flex: 1; max-width: 320px;">`;
		EXP_CATEGORIES.slice(0, 3).forEach(category => {
			const exp = categoryTotals[category] || 0;
			const percentage = totalExp > 0 ? ((exp / totalExp) * 100).toFixed(1) : '0.0';
			
			if (exp > 0) {
				const emoji = CATEGORY_EMOJIS[category] || '';
				html += `
					<div style="display: flex; align-items: center; gap: 12px; padding: 8px; background: rgba(0,0,0,0.1); border-radius: 6px;">
						<div style="width: 20px; height: 20px; background-color: ${colors[category]}; border-radius: 4px; flex-shrink: 0;"></div>
						<span>${emoji} <strong>${category}:</strong> ${percentage}% (${exp} EXP)</span>
					</div>
				`;
			}
		});
		html += `</div>`;
		
		// Right column
		html += `<div style="display: flex; flex-direction: column; gap: 10px; flex: 1; max-width: 320px;">`;
		EXP_CATEGORIES.slice(3, 6).forEach(category => {
			const exp = categoryTotals[category] || 0;
			const percentage = totalExp > 0 ? ((exp / totalExp) * 100).toFixed(1) : '0.0';
			
			if (exp > 0) {
				const emoji = CATEGORY_EMOJIS[category] || '';
				html += `
					<div style="display: flex; align-items: center; gap: 12px; padding: 8px; background: rgba(0,0,0,0.1); border-radius: 6px;">
						<div style="width: 20px; height: 20px; background-color: ${colors[category]}; border-radius: 4px; flex-shrink: 0;"></div>
						<span>${emoji} <strong>${category}:</strong> ${percentage}% (${exp} EXP)</span>
					</div>
				`;
			}
		});
		html += `</div>`;
		
		html += '</div>';
		html += '</div>';
		
		return html;
	}

	generateEvolutionChart(): string {
		const expHistory = (this.settings as any).expHistory || [];
		
		if (expHistory.length === 0) {
			return '<div style="text-align: center; color: #888;">No EXP history yet</div>';
		}

		// Generate unique ID for this chart instance
		const chartId = 'evolution-chart-' + Math.random().toString(36).substr(2, 9);

		// Store chart data in settings for button functionality
		(this.settings as any).chartData = (this.settings as any).chartData || {};
		(this.settings as any).chartData[chartId] = {
			history: expHistory,
			activeRange: 'all'
		};

		// Calculate percentages and generate chart - centralized like pie chart
		let html = '<div style="display: flex; flex-direction: column; align-items: center; gap: 15px; margin: 160px 0 20px 0;">';
		
		// SVG Line Chart (600x500 for better visibility)
		html += `<div id="${chartId}-svg" style="width: 600px; height: 500px; margin-bottom: 10px;">`;
		html += this.generateEvolutionChartSVG(expHistory, 'all');
		html += `</div>`;
		
		// Time range buttons (moved below chart)
		html += `<div id="${chartId}-buttons" style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: center;">`;
		html += `<button class="evo-btn evo-btn-active" data-range="all" style="padding: 8px 16px; background: #f4c542; color: #1e1e1e; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; transition: all 0.2s;">Total</button>`;
		html += `<button class="evo-btn" data-range="1" style="padding: 8px 16px; background: #4a4a4a; color: #ffffff; border: none; border-radius: 5px; cursor: pointer; transition: all 0.2s;">1 Day</button>`;
		html += `<button class="evo-btn" data-range="7" style="padding: 8px 16px; background: #4a4a4a; color: #ffffff; border: none; border-radius: 5px; cursor: pointer; transition: all 0.2s;">1 Week</button>`;
		html += `<button class="evo-btn" data-range="30" style="padding: 8px 16px; background: #4a4a4a; color: #ffffff; border: none; border-radius: 5px; cursor: pointer; transition: all 0.2s;">1 Month</button>`;
		html += `<button class="evo-btn" data-range="180" style="padding: 8px 16px; background: #4a4a4a; color: #ffffff; border: none; border-radius: 5px; cursor: pointer; transition: all 0.2s;">6 Months</button>`;
		html += `<button class="evo-btn" data-range="365" style="padding: 8px 16px; background: #4a4a4a; color: #ffffff; border: none; border-radius: 5px; cursor: pointer; transition: all 0.2s;">1 Year</button>`;
		html += `</div>`;
		
		html += '</div>';
		
		return html;
	}

	generateEvolutionChartSVG(expHistory: { date: string; exp: number }[], range: string, mode: string = 'comparison'): string {
		// Sort by date
		const sorted = [...expHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
		
		if (sorted.length === 0) {
			return '<div style="text-align: center; color: #888; padding: 200px 0;">No data available</div>';
		}
		
		// Filter by date range
		let dataPoints: { date: string; totalExp: number }[] = [];
		
		if (range === 'all') {
			// Show daily EXP evolution (NOT cumulative) - INCLUDING TODAY
			// Group by date and sum EXP for each day
			const dailyExpMap: { [key: string]: number } = {};
			sorted.forEach(item => {
				if (!dailyExpMap[item.date]) {
					dailyExpMap[item.date] = 0;
				}
				dailyExpMap[item.date] += item.exp;
			});
			
			// Get all dates sorted
			const allDates = Object.keys(dailyExpMap).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
			
			// Add today if not present (with 0 EXP)
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			const todayStr = today.toISOString().split('T')[0];
			
			// Always add today (even if not the last date)
			if (!dailyExpMap[todayStr]) {
				dailyExpMap[todayStr] = 0;
				allDates.push(todayStr);
				allDates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
			}
			
			// Show DAILY EXP for each date (line fluctuates up and down)
			dataPoints = allDates.map(date => {
				return { date, totalExp: dailyExpMap[date] };
			});
		} else {
			const days = parseInt(range);
			
			// Always ignore today FIRST for comparison/total views
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			
			// Calculate daily EXP map ONLY for dates before today
			const dailyExpMap: { [key: string]: number } = {};
			sorted.forEach(item => {
				// Only add if date is before today
				const itemDate = new Date(item.date);
				itemDate.setHours(0, 0, 0, 0);
				if (itemDate.getTime() < today.getTime()) {
					if (!dailyExpMap[item.date]) {
						dailyExpMap[item.date] = 0;
					}
					dailyExpMap[item.date] += item.exp;
				}
			});
			
			// Get all dates before today, sorted
			const datesBeforeToday = Object.keys(dailyExpMap).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
			
			if (datesBeforeToday.length < 1) {
				return '<div style="text-align: center; color: #888; padding: 200px 0;">Need at least 1 day of data (excluding today)</div>';
			}
			
			// Get the most recent date (yesterday)
			const mostRecentDate = new Date(datesBeforeToday[datesBeforeToday.length - 1]);
			
			if (mode === 'total') {
				// TOTAL MODE: Show total EXP gained in the period (2 points: start and end)
				const periodEnd = new Date(mostRecentDate.getTime());
				// For 1 day, we want to show that 1 day, not 0 days
				const periodStart = new Date(mostRecentDate.getTime() - Math.max(0, days - 1) * 24 * 60 * 60 * 1000);
				
				// Get dates in the period
				const periodDates = datesBeforeToday.filter(date => {
					const d = new Date(date);
					return d >= periodStart && d <= periodEnd;
				});
				
				if (periodDates.length === 0) {
					return '<div style="text-align: center; color: #888; padding: 200px 0;">No data for this period</div>';
				}
				
				// Calculate TOTAL EXP in this period
				const totalExpInPeriod = periodDates.reduce((sum, date) => sum + (dailyExpMap[date] || 0), 0);
				
				// Create 2 data points: start (0) and end (total)
				const startDate = periodDates[0];
				const endDate = periodDates[periodDates.length - 1];
				
				dataPoints = [
					{ date: startDate, totalExp: 0 },
					{ date: endDate, totalExp: totalExpInPeriod }
				];
			} else {
				// COMPARISON MODE: Compare Period 1 vs Period 2
				// Period 1: Most recent period (yesterday going back 'days' days)
				const period1End = new Date(mostRecentDate.getTime());
				const period1Start = new Date(mostRecentDate.getTime() - Math.max(0, days - 1) * 24 * 60 * 60 * 1000);
				
				// Period 2: Previous period (same duration, before period 1)
				const period2End = new Date(period1Start.getTime() - 24 * 60 * 60 * 1000);
				const period2Start = new Date(period2End.getTime() - Math.max(0, days - 1) * 24 * 60 * 60 * 1000);
				
				// Get dates in each period
				const period1Dates = datesBeforeToday.filter(date => {
					const d = new Date(date);
					return d >= period1Start && d <= period1End;
				});
				
				const period2Dates = datesBeforeToday.filter(date => {
					const d = new Date(date);
					return d >= period2Start && d <= period2End;
				});
				
				if (period1Dates.length === 0 && period2Dates.length === 0) {
					return '<div style="text-align: center; color: #888; padding: 200px 0;">Not enough data for comparison</div>';
				}
				
				// Calculate total EXP for each period
				const period1Total = period1Dates.reduce((sum, date) => sum + (dailyExpMap[date] || 0), 0);
				const period2Total = period2Dates.reduce((sum, date) => sum + (dailyExpMap[date] || 0), 0);
				
				// Create data points for visualization (2 points: period 2 first, then period 1)
				// Use representative dates for each period
				const period2Label = period2Dates.length > 0 ? period2Dates[Math.floor(period2Dates.length / 2)] : period2Start.toISOString().split('T')[0];
				const period1Label = period1Dates.length > 0 ? period1Dates[Math.floor(period1Dates.length / 2)] : period1End.toISOString().split('T')[0];
				
				// Put period 2 (older) first, then period 1 (more recent)
				// This way the calculation will be: period1 - period2 (recent - old)
				dataPoints = [
					{ date: period2Label, totalExp: period2Total },
					{ date: period1Label, totalExp: period1Total }
				];
			}
		}
		
		if (dataPoints.length === 0) {
			return '<div style="text-align: center; color: #888; padding: 200px 0;">No data for this period</div>';
		}
		
		// SVG dimensions
		const width = 600;
		const height = 500;
		const padding = { top: 30, right: 30, bottom: 50, left: 70 };
		const chartWidth = width - padding.left - padding.right;
		const chartHeight = height - padding.top - padding.bottom;
		
		// Find min and max values
		const minExp = Math.min(...dataPoints.map(d => d.totalExp));
		const maxExp = Math.max(...dataPoints.map(d => d.totalExp));
		const expRange = maxExp - minExp;
		
		// Generate SVG
		let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="background: #2a2a2a; border-radius: 10px;">`;
		
		// Grid lines
		const gridLines = 5;
		for (let i = 0; i <= gridLines; i++) {
			const y = padding.top + (chartHeight / gridLines) * i;
			svg += `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#444" stroke-width="1"/>`;
			
			const expValue = maxExp - (expRange / gridLines) * i;
			svg += `<text x="${padding.left - 10}" y="${y + 5}" text-anchor="end" fill="#888" font-size="12">${Math.round(expValue)}</text>`;
		}
		
		// Plot line
		if (dataPoints.length > 0) {
			let pathData = '';
			
			dataPoints.forEach((point, index) => {
				const x = padding.left + (chartWidth / (dataPoints.length - 1 || 1)) * index;
				const y = padding.top + chartHeight - ((point.totalExp - minExp) / expRange) * chartHeight;
				
				if (index === 0) {
					pathData += `M ${x} ${y}`;
				} else {
					pathData += ` L ${x} ${y}`;
				}
			});
			
			// Determine line color based on mode and trend
			let lineColor: string;
			if (mode === 'total') {
				// For "total" mode (2nd click), always green (accumulated EXP)
				lineColor = '#4ade80';
			} else if (range === 'all') {
				// For "all" view (Total button), check if today < yesterday
				const firstExp = dataPoints[0]?.totalExp || 0;
				const lastExp = dataPoints[dataPoints.length - 1]?.totalExp || 0;
				const diff = lastExp - firstExp;
				lineColor = diff >= 0 ? '#4ade80' : '#f87171';
			} else {
				// For comparison mode, use green if up, red if down
				const firstExp = dataPoints[0]?.totalExp || 0;
				const lastExp = dataPoints[dataPoints.length - 1]?.totalExp || 0;
				const diff = lastExp - firstExp;
				lineColor = diff >= 0 ? '#4ade80' : '#f87171';
			}
			
			// Draw line
			svg += `<path d="${pathData}" stroke="${lineColor}" stroke-width="3" fill="none"/>`;
			
			// Draw points
			dataPoints.forEach((point, index) => {
				const x = padding.left + (chartWidth / (dataPoints.length - 1 || 1)) * index;
				const y = padding.top + chartHeight - ((point.totalExp - minExp) / expRange) * chartHeight;
				
				svg += `<circle cx="${x}" cy="${y}" r="4" fill="${lineColor}"/>`;
			});
		}
		
		// X-axis labels (show max 10 dates)
		const labelStep = Math.ceil(dataPoints.length / 10);
		dataPoints.forEach((point, index) => {
			if (index % labelStep === 0 || index === dataPoints.length - 1) {
				const x = padding.left + (chartWidth / (dataPoints.length - 1 || 1)) * index;
				const dateObj = new Date(point.date);
				
				// If in total mode for 1 Year (365 days), show month/year format
				let label: string;
				if (mode === 'total' && range === '365') {
					// Month name + year (e.g., "Jan/24")
					const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
					label = `${monthNames[dateObj.getMonth()]}/${String(dateObj.getFullYear()).slice(-2)}`;
				} else {
					// Day/month format (e.g., "15/3")
					label = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;
				}
				
				svg += `<text x="${x}" y="${height - padding.bottom + 20}" text-anchor="middle" fill="#888" font-size="11">${label}</text>`;
			}
		});
		
		// Axis labels
		let yAxisLabel: string;
		if (mode === 'total' && range === '365') {
			yAxisLabel = 'Monthly EXP';
		} else if (mode === 'total') {
			yAxisLabel = 'Period EXP';
		} else if (range === 'all') {
			yAxisLabel = 'All Period EXP';
		} else {
			yAxisLabel = 'Period EXP';
		}
		svg += `<text x="${width / 2}" y="${height - 10}" text-anchor="middle" fill="#aaa" font-size="14" font-weight="bold">Date</text>`;
		svg += `<text x="20" y="${height / 2}" text-anchor="middle" fill="#aaa" font-size="14" font-weight="bold" transform="rotate(-90, 20, ${height / 2})">${yAxisLabel}</text>`;
		
		// Stats
		if (mode === 'total') {
			// For "total" mode (2nd visualization), show total EXP in the period
			const lastExp = dataPoints[dataPoints.length - 1]?.totalExp || 0;
			svg += `<text x="${width - padding.right}" y="${padding.top - 5}" text-anchor="end" fill="#4ade80" font-size="16" font-weight="bold">Total: ${lastExp} EXP</text>`;
		} else if (range === 'all') {
			// For "all" view, show maximum EXP in history
			const maxExp = Math.max(...dataPoints.map(d => d.totalExp));
			svg += `<text x="${width - padding.right}" y="${padding.top - 5}" text-anchor="end" fill="#4ade80" font-size="16" font-weight="bold">Total: ${maxExp} EXP</text>`;
		} else {
			// For comparison views, show difference between periods
			const lastExp = dataPoints[dataPoints.length - 1]?.totalExp || 0;
			const firstExp = dataPoints[0]?.totalExp || 0;
			const gain = lastExp - firstExp;
			const trend = gain >= 0 ? '↗' : '↘';
			const trendColor = gain >= 0 ? '#4ade80' : '#f87171';
			svg += `<text x="${width - padding.right}" y="${padding.top - 5}" text-anchor="end" fill="${trendColor}" font-size="16" font-weight="bold">${trend} ${gain >= 0 ? '+' : ''}${gain} EXP</text>`;
		}
		
		svg += '</svg>';
		
		return svg;
	}

	generateRadarChart(): string {
		const attributeCounts = (this.settings as any).attributeCounts || {};
		
		// Check if there's any data
		const totalNotes = Object.values(attributeCounts).reduce((sum: number, count) => sum + (count as number), 0);
		
		if (totalNotes === 0) {
			return '<div style="text-align: center; color: #888;">No attribute data yet</div>';
		}

		// Generate unique ID for this chart instance
		const chartId = 'radar-chart-' + Math.random().toString(36).substr(2, 9);

		// SVG dimensions - ADJUSTED for better spacing
		const size = 600;
		const center = size / 2;
		const radius = 170; // Reduced to give more space for labels
		const maxLevel = 10; // Maximum level for each attribute (0-10)
		const labelDistance = 70; // Distance from radar edge to labels
		const topPadding = 30; // Extra padding at the top
		
		// Colors for attributes (for labels only)
		const colors: { [key: string]: string } = {
			'Intel': '#4ecdc4',
			'Spiritual': '#f9ca24',
			'Core': '#ee5a6f',
			'Emotional': '#95e1d3',
			'Physical': '#ff6b6b'
		};
		
		// Function to get EX rank based on count
		const getExRank = (exp: number): string => {
			const actualLevel = this.calculateLevel(exp);
			
			if (actualLevel < 100) return '';
			
			// Calculate EX rank based on EXP above level 100
			const level100Exp = LEVEL_TABLE[100].exp; // 260,200 EXP
			
			if (exp < level100Exp * 2) return 'EX';      // Up to 520,400 EXP
			if (exp < level100Exp * 4) return 'EX+';     // Up to 1,040,800 EXP
			if (exp < level100Exp * 8) return 'EX++';    // Up to 2,081,600 EXP
			return 'EX+++';                               // Above 2,081,600 EXP
		};
		
		// Function to get visual level (0-10) from EXP with decimals
		const getVisualLevel = (exp: number): number => {
			// Use the level table to find actual level
			const actualLevel = this.calculateLevel(exp);
			
			// Visual level is actualLevel / 10, capped at 10
			// Level 5 = visual 0.5, level 17 = visual 1.7, level 100 = visual 10
			const visualLevel = Math.min(actualLevel / 10, maxLevel);
			
			return visualLevel;
		};
		
		// Helper to format visual level (no decimal if integer)
		const formatVisualLevel = (level: number): string => {
			// If level is integer (like 1.0, 2.0, 10.0), show without decimal
			if (level === Math.floor(level)) {
				return level.toString();
			}
			// Otherwise show with 1 decimal place
			return level.toFixed(1);
		};
		
		// Main container: flex-column to place chart and details vertically
		let html = '<div style="display: flex; flex-direction: column; align-items: center; gap: 20px; margin: 20px 0 20px 0; justify-content: center;">';
		
		// SVG Radar Chart with click to toggle details - increased height for top padding
		html += `<svg width="${size}" height="${size + topPadding}" viewBox="0 ${-topPadding} ${size} ${size + topPadding}" style="cursor: pointer; flex-shrink: 0;" onclick="document.getElementById('${chartId}').style.display = document.getElementById('${chartId}').style.display === 'none' ? 'flex' : 'none';">`;
		
		// Background
		html += `<rect x="0" y="${-topPadding}" width="${size}" height="${size + topPadding}" fill="#2a2a2a" rx="10"/>`;
		
		// Draw concentric PENTAGONS for grid (levels 2, 4, 6, 8, 10)
		const angleStep = (2 * Math.PI) / ATTRIBUTES.length;
		for (let level = 2; level <= maxLevel; level += 2) {
			const levelRadius = (radius / maxLevel) * level;
			const gridPoints: string[] = [];
			
			ATTRIBUTES.forEach((attr, index) => {
				const angle = angleStep * index - Math.PI / 2;
				const x = center + levelRadius * Math.cos(angle);
				const y = center + levelRadius * Math.sin(angle);
				gridPoints.push(`${x},${y}`);
			});
			
			html += `<polygon points="${gridPoints.join(' ')}" fill="none" stroke="#444" stroke-width="1"/>`;
		}
		
		// Draw axes for each attribute
		ATTRIBUTES.forEach((attr, index) => {
			const angle = angleStep * index - Math.PI / 2; // Start from top
			const x = center + radius * Math.cos(angle);
			const y = center + radius * Math.sin(angle);
			
			html += `<line x1="${center}" y1="${center}" x2="${x}" y2="${y}" stroke="#555" stroke-width="2"/>`;
		});
		
		// Plot data points and create polygon
		let points: string[] = [];
		ATTRIBUTES.forEach((attr, index) => {
			const exp = attributeCounts[attr] || 0;
			const visualLevel = getVisualLevel(exp);
			const normalizedValue = (visualLevel / maxLevel) * radius;
			
			const angle = angleStep * index - Math.PI / 2;
			const x = center + normalizedValue * Math.cos(angle);
			const y = center + normalizedValue * Math.sin(angle);
			
			points.push(`${x},${y}`);
		});
		
		// Draw polygon WITH colored fill (semi-transparent)
		html += `<polygon points="${points.join(' ')}" fill="rgba(244, 197, 66, 0.2)" stroke="#f4c542" stroke-width="3"/>`;
		
		// Draw points on polygon - ALL YELLOW
		ATTRIBUTES.forEach((attr, index) => {
			const exp = attributeCounts[attr] || 0;
			const visualLevel = getVisualLevel(exp);
			const normalizedValue = (visualLevel / maxLevel) * radius;
			
			const angle = angleStep * index - Math.PI / 2;
			const x = center + normalizedValue * Math.cos(angle);
			const y = center + normalizedValue * Math.sin(angle);
			
			// ALL POINTS YELLOW (#f4c542)
			html += `<circle cx="${x}" cy="${y}" r="6" fill="#f4c542" stroke="#fff" stroke-width="2"/>`;
		});
		
		// Add labels - INCREASED label distance to prevent clipping
		ATTRIBUTES.forEach((attr, index) => {
			const exp = attributeCounts[attr] || 0;
			const visualLevel = getVisualLevel(exp);
			const exRank = getExRank(exp);
			const angle = angleStep * index - Math.PI / 2;
			const labelDist = radius + labelDistance; // Use the defined labelDistance
			const x = center + labelDist * Math.cos(angle);
			const y = center + labelDist * Math.sin(angle);
			
			const emoji = ATTRIBUTE_EMOJIS[attr] || '';
			
			// Emoji
			html += `<text x="${x}" y="${y - 15}" text-anchor="middle" fill="${colors[attr]}" font-size="24">${emoji}</text>`;
			// Attribute name
			html += `<text x="${x}" y="${y + 5}" text-anchor="middle" fill="#ffffff" font-size="14" font-weight="bold">${attr}</text>`;
			
			// Level display - Show EX rank if applicable, otherwise show visual level
			// ALWAYS show level, even if 0
			if (exRank) {
				html += `<text x="${x}" y="${y + 23}" text-anchor="middle" fill="#f4c542" font-size="16" font-weight="bold">${exRank}</text>`;
			} else {
				// Show visual level with smart formatting (no decimal if integer)
				const levelText = formatVisualLevel(visualLevel);
				html += `<text x="${x}" y="${y + 23}" text-anchor="middle" fill="${colors[attr]}" font-size="16" font-weight="bold">Lv ${levelText}</text>`;
			}
		});
		
		html += '</svg>';
		
		// Collapsible Details (hidden by default, click chart to show)
		html += `<div id="${chartId}" style="display: none; flex-direction: row; gap: 15px; flex-wrap: wrap; font-size: 16px; width: 100%; max-width: 800px; justify-content: center;">`;
		
		// Left column (first 3 attributes with EXP)
		html += `<div style="display: flex; flex-direction: column; gap: 10px; flex: 1; max-width: 350px;">`;
		let leftCount = 0;
		ATTRIBUTES.forEach(attr => {
			const exp = attributeCounts[attr] || 0;
			if (leftCount < 3) {
				const emoji = ATTRIBUTE_EMOJIS[attr] || '';
				const visualLevel = getVisualLevel(exp);
				const exRank = getExRank(exp);
				
				// Show only: Lv X or EX rank
				let levelText = formatVisualLevel(visualLevel);
				let levelDisplay = `Lv ${levelText}`;
				if (exRank) {
					levelDisplay = exRank;
				}
				
				html += `
					<div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 6px; border-left: 4px solid ${colors[attr]};">
						<div style="display: flex; align-items: center; gap: 8px;">
							<span style="font-size: 20px;">${emoji}</span>
							<strong style="color: ${colors[attr]};">${attr}</strong>
						</div>
						<div style="display: flex; flex-direction: column; align-items: flex-end;">
							<span style="color: #fff; font-weight: bold;">${levelDisplay}</span>
							<span style="color: #888; font-size: 11px;">${exp} EXP</span>
						</div>
					</div>
				`;
				leftCount++;
			}
		});
		html += `</div>`;
		
		// Right column (remaining attributes with EXP)
		html += `<div style="display: flex; flex-direction: column; gap: 10px; flex: 1; max-width: 350px;">`;
		let rightCount = 0;
		ATTRIBUTES.forEach(attr => {
			const exp = attributeCounts[attr] || 0;
			if (rightCount >= 0) { // Skip first 3 (already in left column)
				if (ATTRIBUTES.indexOf(attr) >= 3) {
					const emoji = ATTRIBUTE_EMOJIS[attr] || '';
					const visualLevel = getVisualLevel(exp);
					const exRank = getExRank(exp);
					
					// Show only: Lv X or EX rank
					let levelText = formatVisualLevel(visualLevel);
					let levelDisplay = `Lv ${levelText}`;
					if (exRank) {
						levelDisplay = exRank;
					}
					
					html += `
						<div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 6px; border-left: 4px solid ${colors[attr]};">
							<div style="display: flex; align-items: center; gap: 8px;">
								<span style="font-size: 20px;">${emoji}</span>
								<strong style="color: ${colors[attr]};">${attr}</strong>
							</div>
							<div style="display: flex; flex-direction: column; align-items: flex-end;">
								<span style="color: #fff; font-weight: bold;">${levelDisplay}</span>
								<span style="color: #888; font-size: 11px;">${exp} EXP</span>
							</div>
						</div>
					`;
					rightCount++;
				}
			}
		});
		html += `</div>`;
		
		html += '</div>';
		html += '</div>';
		
		return html;
	}

	generateWheelOfLifeChart(): string {
		const wheelOfLifeCounts = (this.settings as any).wheelOfLifeCounts || {};
		
		// Check if there's any data
		const totalExp = Object.values(wheelOfLifeCounts).reduce((sum: number, exp) => sum + (exp as number), 0);
		
		if (totalExp === 0) {
			return '<div style="text-align: center; color: #888;">No Wheel of Life data yet</div>';
		}

		// Generate unique ID for this chart instance
		const chartId = 'wheel-chart-' + Math.random().toString(36).substr(2, 9);

		// SVG dimensions
		const size = 850;
		const center = size / 2;
		const maxRadius = 250; // Maximum radius for level 10
		const minRadius = 0; // Start from center
		
		// Colors for each area (vibrant gradient)
		const colors: { [key: string]: string } = {
			'Spiritual': '#9b59b6',
			'Family': '#e74c3c',
			'Financial': '#2ecc71',
			'Emotional': '#f39c12',
			'Physical Health': '#e67e22',
			'Intellectual': '#3498db',
			'Professional': '#1abc9c',
			'Social': '#16a085',
			'Romantic': '#c0392b',
			'Leisure': '#d35400',
			'Purpose': '#8e44ad',
			'Environment': '#27ae60'
		};
		
		// Function to get visual level (1-10) from EXP
		const getVisualLevel = (exp: number): number => {
			// Use the level table to find actual level
			const actualLevel = this.calculateLevel(exp);
			
			// Visual level is actualLevel / 10, capped at 10
			// Level 5 = visual 0.5, level 17 = visual 1.7, level 100 = visual 10
			const visualLevel = Math.min(actualLevel / 10, 10);
			
			return visualLevel;
		};
		
		// Helper to format visual level (no decimal if integer)
		const formatVisualLevel = (level: number): string => {
			// If level is integer (like 1.0, 2.0, 10.0), show without decimal
			if (level === Math.floor(level)) {
				return level.toString();
			}
			// Otherwise show with 1 decimal place
			return level.toFixed(1);
		};
		
		// Function to get EX rank for levels above 100
		const getExRank = (exp: number): string => {
			const actualLevel = this.calculateLevel(exp);
			
			if (actualLevel < 100) return '';
			
			// Calculate EX rank based on EXP above level 100
			const level100Exp = LEVEL_TABLE[100].exp; // 260,200 EXP
			
			if (exp < level100Exp * 2) return 'EX';      // Up to 520,400 EXP
			if (exp < level100Exp * 4) return 'EX+';     // Up to 1,040,800 EXP
			if (exp < level100Exp * 8) return 'EX++';    // Up to 2,081,600 EXP
			return 'EX+++';                               // Above 2,081,600 EXP
		};
		
		// Main container - remove horizontal centering to align left
		let html = '<div style="display: flex; flex-direction: column; align-items: flex-start; gap: 20px; margin: 20px 0;">';
		
		// SVG Wheel Chart with click to toggle details
		html += `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="cursor: pointer;" onclick="document.getElementById('${chartId}').style.display = document.getElementById('${chartId}').style.display === 'none' ? 'flex' : 'none';">`;
		
		// Background
		html += `<rect width="${size}" height="${size}" fill="#2a2a2a" rx="10"/>`;
		
		// Draw concentric circles for grid (levels 2, 4, 6, 8, 10)
		for (let level = 2; level <= 10; level += 2) {
			const radius = (maxRadius / 10) * level;
			html += `<circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="#444" stroke-width="1"/>`;
		}
		
		// Calculate angle per area (360° / 12 areas)
		const anglePerArea = (2 * Math.PI) / WHEEL_OF_LIFE_AREAS.length;
		
		// Draw each area as a filled segment
		WHEEL_OF_LIFE_AREAS.forEach((area, index) => {
			const exp = wheelOfLifeCounts[area] || 0;
			const visualLevel = getVisualLevel(exp);
			const fillRadius = (maxRadius / 10) * visualLevel;
			
			if (exp > 0) {
				// Center the first segment at the top by offsetting by half a segment
				const startAngle = anglePerArea * index - Math.PI / 2 - anglePerArea / 2;
				const endAngle = anglePerArea * (index + 1) - Math.PI / 2 - anglePerArea / 2;
				
				// Calculate segment path (filled from center)
				const startX = center + fillRadius * Math.cos(startAngle);
				const startY = center + fillRadius * Math.sin(startAngle);
				const endX = center + fillRadius * Math.cos(endAngle);
				const endY = center + fillRadius * Math.sin(endAngle);
				
				const largeArcFlag = 0; // Always small arc since we have 12 segments
				
				const pathData = [
					`M ${center} ${center}`,
					`L ${startX} ${startY}`,
					`A ${fillRadius} ${fillRadius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
					`Z`
				].join(' ');
				
				html += `<path d="${pathData}" fill="${colors[area]}" opacity="0.8" stroke="#ffffff" stroke-width="2"/>`;
			}
		});
		
		// Draw separator lines between areas
		WHEEL_OF_LIFE_AREAS.forEach((area, index) => {
			// Center the lines by offsetting by half a segment
			const angle = anglePerArea * index - Math.PI / 2 - anglePerArea / 2;
			const x = center + maxRadius * Math.cos(angle);
			const y = center + maxRadius * Math.sin(angle);
			
			html += `<line x1="${center}" y1="${center}" x2="${x}" y2="${y}" stroke="#555" stroke-width="2"/>`;
		});
		
		// Add labels outside the wheel
		const labelDistance = maxRadius + 50;
		WHEEL_OF_LIFE_AREAS.forEach((area, index) => {
			// Center labels at middle of each segment (no offset needed since segments are already centered)
			const angle = anglePerArea * index - Math.PI / 2;
			const x = center + labelDistance * Math.cos(angle);
			const y = center + labelDistance * Math.sin(angle);
			
			const emoji = WHEEL_OF_LIFE_EMOJIS[area] || '';
			const exp = wheelOfLifeCounts[area] || 0;
			const visualLevel = getVisualLevel(exp);
			const exRank = getExRank(exp);
			
			// Emoji
			html += `<text x="${x}" y="${y - 15}" text-anchor="middle" fill="${colors[area]}" font-size="20">${emoji}</text>`;
			
			// Area name (split long names into two lines)
			const areaName = area;
			if (areaName.includes(' ')) {
				const parts = areaName.split(' ');
				html += `<text x="${x}" y="${y}" text-anchor="middle" fill="#ffffff" font-size="11" font-weight="bold">${parts[0]}</text>`;
				html += `<text x="${x}" y="${y + 12}" text-anchor="middle" fill="#ffffff" font-size="11" font-weight="bold">${parts.slice(1).join(' ')}</text>`;
			} else {
				html += `<text x="${x}" y="${y + 5}" text-anchor="middle" fill="#ffffff" font-size="12" font-weight="bold">${areaName}</text>`;
			}
			
			// Level display - ALWAYS show, even if 0
			let levelText = `Lv ${formatVisualLevel(visualLevel)}`;
			if (exRank) {
				levelText = `${exRank}`;
			}
			html += `<text x="${x}" y="${y + 28}" text-anchor="middle" fill="${colors[area]}" font-size="13" font-weight="bold">${levelText}</text>`;
		});
		
		html += '</svg>';
		
		// Collapsible Details (hidden by default, click chart to show) - 2 columns: 6 left + 6 right
		html += `<div id="${chartId}" style="display: none; flex-direction: row; gap: 12px; font-size: 15px; width: ${size}px;">`;
		
		// Left column (first 6 areas)
		html += `<div style="display: flex; flex-direction: column; gap: 10px; flex: 1;">`;
		WHEEL_OF_LIFE_AREAS.slice(0, 6).forEach(area => {
			const exp = wheelOfLifeCounts[area] || 0;
			const emoji = WHEEL_OF_LIFE_EMOJIS[area] || '';
			const visualLevel = getVisualLevel(exp);
			const exRank = getExRank(exp);
			
			// Show only: Lv X or EX rank
			let levelText = formatVisualLevel(visualLevel);
			let levelDisplay = `Lv ${levelText}`;
			if (exRank) {
				levelDisplay = exRank;
			}
			
			html += `
				<div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 8px; background: rgba(0,0,0,0.2); border-radius: 6px; border-left: 4px solid ${colors[area]};">
					<div style="display: flex; align-items: center; gap: 8px;">
						<span style="font-size: 18px;">${emoji}</span>
						<strong style="color: ${colors[area]};">${area}</strong>
					</div>
					<div style="display: flex; flex-direction: column; align-items: flex-end;">
						<span style="color: #fff; font-weight: bold;">${levelDisplay}</span>
						<span style="color: #888; font-size: 11px;">${exp} EXP</span>
					</div>
				</div>
			`;
		});
		html += `</div>`;
		
		// Right column (remaining 6 areas)
		html += `<div style="display: flex; flex-direction: column; gap: 10px; flex: 1;">`;
		WHEEL_OF_LIFE_AREAS.slice(6, 12).forEach(area => {
			const exp = wheelOfLifeCounts[area] || 0;
			const emoji = WHEEL_OF_LIFE_EMOJIS[area] || '';
			const visualLevel = getVisualLevel(exp);
			const exRank = getExRank(exp);
			
			// Show only: Lv X or EX rank
			let levelText = formatVisualLevel(visualLevel);
			let levelDisplay = `Lv ${levelText}`;
			if (exRank) {
				levelDisplay = exRank;
			}
			
			html += `
				<div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 8px; background: rgba(0,0,0,0.2); border-radius: 6px; border-left: 4px solid ${colors[area]};">
					<div style="display: flex; align-items: center; gap: 8px;">
						<span style="font-size: 18px;">${emoji}</span>
						<strong style="color: ${colors[area]};">${area}</strong>
					</div>
					<div style="display: flex; flex-direction: column; align-items: flex-end;">
						<span style="color: #fff; font-weight: bold;">${levelDisplay}</span>
						<span style="color: #888; font-size: 11px;">${exp} EXP</span>
					</div>
				</div>
			`;
		});
		html += `</div>`;
		
		html += '</div>';
		html += '</div>';
		
		return html;
	}

	generateSwotRadarChart(): string {
		const swotData = (this.settings as any).swotData || [];
		const swotLatestDate = (this.settings as any).swotLatestDate || null;
		
		// Check if there's any data
		if (swotData.length === 0) {
			return '<div style="text-align: center; color: #888;">No SWOT data yet</div>';
		}

		// Group data by category
		const groupedData: { [category: string]: { name: string; value: number }[] } = {};
		SWOT_CATEGORIES.forEach(cat => groupedData[cat] = []);
		
		swotData.forEach((item: { category: string; name: string; value: number }) => {
			if (groupedData[item.category]) {
				const existing = groupedData[item.category].find(i => i.name === item.name);
				if (!existing) {
					groupedData[item.category].push({ name: item.name, value: item.value });
				} else {
					existing.value = item.value;
				}
			}
		});

		// Calculate average value per category for the radar chart
		const categoryAverages: { [category: string]: number } = {};
		SWOT_CATEGORIES.forEach(category => {
			const items = groupedData[category];
			if (items.length > 0) {
				const sum = items.reduce((acc, item) => acc + item.value, 0);
				categoryAverages[category] = sum / items.length;
			} else {
				categoryAverages[category] = 0;
			}
		});

		// Generate unique ID for this chart instance
		const chartId = 'swot-chart-' + Math.random().toString(36).substr(2, 9);

		// SVG dimensions - increased to prevent clipping
		const size = 850;
		const center = size / 2;
		const radius = 250;
		const maxValue = 10;

		// Colors for each category
		const colors: { [key: string]: string } = {
			'Strengths': '#2ecc71',
			'Weaknesses': '#e74c3c',
			'Opportunities': '#3498db',
			'Threats': '#f39c12'
		};
		
		// Main container - remove horizontal centering to align left
		let html = '<div style="display: flex; flex-direction: column; align-items: flex-start; gap: 20px; margin: 20px 0;">';
		
		// Title with date - centralized above the chart
		if (swotLatestDate) {
			html += `<div style="text-align: center; color: #888; font-size: 14px; margin-bottom: -10px; width: ${size}px;">`;
			html += `SWOT Analysis from <strong style="color: #f4c542;">${swotLatestDate}</strong>`;
			html += `</div>`;
		}
		
		// SVG Radar Chart with click to toggle details
		html += `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="cursor: pointer;" onclick="document.getElementById('${chartId}').style.display = document.getElementById('${chartId}').style.display === 'none' ? 'flex' : 'none';">`;
		
		// Background with padding
		html += `<rect x="20" y="20" width="${size - 40}" height="${size - 40}" fill="#2a2a2a" rx="10"/>`;
		
		// Draw concentric circles for grid (values 2, 4, 6, 8, 10)
		for (let value = 2; value <= maxValue; value += 2) {
			const r = (radius / maxValue) * value;
			html += `<circle cx="${center}" cy="${center}" r="${r}" fill="none" stroke="#444" stroke-width="1"/>`;
		}
		
		// Calculate angle per category (360° / 4 categories)
		const anglePerCategory = (2 * Math.PI) / SWOT_CATEGORIES.length;
		
		// Draw axis lines
		SWOT_CATEGORIES.forEach((category, index) => {
			const angle = anglePerCategory * index - Math.PI / 2; // Start from top
			const x = center + radius * Math.cos(angle);
			const y = center + radius * Math.sin(angle);
			
			html += `<line x1="${center}" y1="${center}" x2="${x}" y2="${y}" stroke="#555" stroke-width="2"/>`;
		});
		
		// Draw data polygon
		const points: string[] = [];
		SWOT_CATEGORIES.forEach((category, index) => {
			const value = categoryAverages[category] || 0;
			const normalizedRadius = (radius / maxValue) * value;
			const angle = anglePerCategory * index - Math.PI / 2;
			const x = center + normalizedRadius * Math.cos(angle);
			const y = center + normalizedRadius * Math.sin(angle);
			points.push(`${x},${y}`);
		});
		
		html += `<polygon points="${points.join(' ')}" fill="rgba(52, 152, 219, 0.3)" stroke="#3498db" stroke-width="3"/>`;
		
		// Draw data points
		SWOT_CATEGORIES.forEach((category, index) => {
			const value = categoryAverages[category] || 0;
			const normalizedRadius = (radius / maxValue) * value;
			const angle = anglePerCategory * index - Math.PI / 2;
			const x = center + normalizedRadius * Math.cos(angle);
			const y = center + normalizedRadius * Math.sin(angle);
			
			html += `<circle cx="${x}" cy="${y}" r="6" fill="${colors[category]}" stroke="#ffffff" stroke-width="2"/>`;
		});
		
		// Add labels outside the radar
		const labelDistance = radius + 60;
		SWOT_CATEGORIES.forEach((category, index) => {
			const angle = anglePerCategory * index - Math.PI / 2;
			const x = center + labelDistance * Math.cos(angle);
			const y = center + labelDistance * Math.sin(angle);
			
			const emoji = SWOT_EMOJIS[category] || '';
			const avgValue = categoryAverages[category] || 0;
			
			// Emoji
			html += `<text x="${x}" y="${y - 20}" text-anchor="middle" fill="${colors[category]}" font-size="24">${emoji}</text>`;
			
			// Category name
			html += `<text x="${x}" y="${y}" text-anchor="middle" fill="#ffffff" font-size="14" font-weight="bold">${category}</text>`;
			
			// Average value
			html += `<text x="${x}" y="${y + 18}" text-anchor="middle" fill="${colors[category]}" font-size="16" font-weight="bold">${avgValue.toFixed(1)}</text>`;
		});
		
		html += '</svg>';
		
		// Collapsible Details (hidden by default, click chart to show)
		html += `<div id="${chartId}" style="display: none; flex-direction: column; gap: 20px; font-size: 15px; width: ${size}px;">`;
		
		// Display by category with individual items
		SWOT_CATEGORIES.forEach(category => {
			const items = groupedData[category];
			if (items.length === 0) return;
			
			const emoji = SWOT_EMOJIS[category] || '';
			const color = colors[category];
			const avgValue = categoryAverages[category] || 0;
			
			html += `<div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; border-left: 5px solid ${color};">`;
			html += `<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">`;
			html += `<span style="font-size: 22px;">${emoji}</span>`;
			html += `<strong style="color: ${color}; font-size: 18px;">${category}</strong>`;
			html += `<span style="color: #888; margin-left: auto;">Avg: ${avgValue.toFixed(1)}</span>`;
			html += `</div>`;
			
			// Items grid
			html += `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;">`;
			
			items.forEach(item => {
				html += `
					<div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 6px; border-left: 3px solid ${color};">
						<strong style="color: #fff; font-size: 14px;">${item.name}</strong>
						<span style="color: ${color}; font-weight: bold; font-size: 16px;">${item.value}</span>
					</div>
				`;
			});
			
			html += `</div>`;
			html += `</div>`;
		});
		
		html += '</div>';
		html += '</div>';
		
		return html;
	}

	attachEvolutionChartListeners(element: HTMLElement) {
		// Find all evolution chart buttons in this element
		const buttons = element.querySelectorAll('.evo-btn');
		
		buttons.forEach(button => {
			const btn = button as HTMLElement;
			const range = btn.getAttribute('data-range');
			
			// Remove existing listener if any
			const newBtn = btn.cloneNode(true) as HTMLElement;
			btn.parentNode?.replaceChild(newBtn, btn);
			
			// Add click listener
			newBtn.addEventListener('click', () => {
				// Find the chart container
				const buttonsContainer = newBtn.parentElement;
				if (!buttonsContainer) return;
				
				const chartContainer = buttonsContainer.previousElementSibling as HTMLElement;
				if (!chartContainer) return;
				
				const chartId = chartContainer.id.replace('-svg', '');
				const expHistory = (this.settings as any).expHistory || [];
				
				// Get current active button and its mode
				const currentActiveBtn = buttonsContainer.querySelector('.evo-btn[style*="background: rgb(244, 197, 66)"]') as HTMLElement;
				const currentRange = currentActiveBtn?.getAttribute('data-range');
				const currentMode = currentActiveBtn?.getAttribute('data-mode') || 'comparison';
				
				let newMode = 'comparison'; // Default mode for new button clicks
				
				// Check if clicking the same button (toggle mode)
				if (currentActiveBtn === newBtn && range !== 'all') {
					// Toggle between comparison and total mode
					newMode = currentMode === 'comparison' ? 'total' : 'comparison';
					newBtn.setAttribute('data-mode', newMode);
				} else {
					// Different button clicked - reset to comparison mode
					newBtn.setAttribute('data-mode', 'comparison');
				}
				
				// Update button styles
				buttonsContainer.querySelectorAll('.evo-btn').forEach(b => {
					(b as HTMLElement).style.background = '#4a4a4a';
					(b as HTMLElement).style.color = '#ffffff';
					(b as HTMLElement).style.fontWeight = 'normal';
				});
				
				newBtn.style.background = '#f4c542';
				newBtn.style.color = '#1e1e1e';
				newBtn.style.fontWeight = 'bold';
				
				// Update chart with the appropriate mode
				if (range) {
					chartContainer.innerHTML = this.generateEvolutionChartSVG(expHistory, range, newMode);
				}
			});
		});
	}

	generateSwotRadarChart2(): string {
		const swotData = (this.settings as any).swotData || [];
		const swotLatestDate = (this.settings as any).swotLatestDate || null;
		
		// Check if there's any data
		if (swotData.length === 0) {
			return '<div style="text-align: center; color: #888;">No SWOT data yet</div>';
		}

		// Group data by category
		const groupedData: { [category: string]: { name: string; value: number }[] } = {};
		SWOT_CATEGORIES.forEach(cat => groupedData[cat] = []);
		
		swotData.forEach((item: { category: string; name: string; value: number }) => {
			if (groupedData[item.category]) {
				const existing = groupedData[item.category].find(i => i.name === item.name);
				if (!existing) {
					groupedData[item.category].push({ name: item.name, value: item.value });
				} else {
					existing.value = item.value;
				}
			}
		});

		// Flatten all items into a single array for the radar chart
		const allItems: { category: string; name: string; value: number }[] = [];
		SWOT_CATEGORIES.forEach(category => {
			groupedData[category].forEach(item => {
				allItems.push({ category, name: item.name, value: item.value });
			});
		});

		if (allItems.length === 0) {
			return '<div style="text-align: center; color: #888;">No SWOT data yet</div>';
		}

		// Generate unique ID for this chart instance
		const chartId = 'swot-chart2-' + Math.random().toString(36).substr(2, 9);

		// SVG dimensions - same as swot_radar_chart for alignment
		const size = 850;
		const center = size / 2;
		const radius = 250;
		const maxValue = 10;

		// Colors for each category
		const colors: { [key: string]: string } = {
			'Strengths': '#2ecc71',
			'Weaknesses': '#e74c3c',
			'Opportunities': '#3498db',
			'Threats': '#f39c12'
		};
		
		// Main container - add extra margin-top to align with first chart when in columns
		let html = '<div style="display: flex; flex-direction: column; align-items: flex-start; gap: 20px; margin: 100px 0 20px 0;">';
		
		// Title with date - centralized above the chart
		if (swotLatestDate) {
			html += `<div style="text-align: center; color: #888; font-size: 14px; margin-bottom: -10px; width: ${size}px;">`;
			html += `SWOT Individual Items Radar from <strong style="color: #f4c542;">${swotLatestDate}</strong>`;
			html += `</div>`;
		}
		
		// SVG Radar Chart with click to toggle details
		html += `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="cursor: pointer;" onclick="document.getElementById('${chartId}').style.display = document.getElementById('${chartId}').style.display === 'none' ? 'flex' : 'none';">`;
		
		// Background with padding
		html += `<rect x="20" y="20" width="${size - 40}" height="${size - 40}" fill="#2a2a2a" rx="10"/>`;
		
		// Draw concentric circles for grid (values 2, 4, 6, 8, 10)
		for (let value = 2; value <= maxValue; value += 2) {
			const r = (radius / maxValue) * value;
			html += `<circle cx="${center}" cy="${center}" r="${r}" fill="none" stroke="#444" stroke-width="1"/>`;
		}
		
		// Calculate angle per item
		const anglePerItem = (2 * Math.PI) / allItems.length;
		
		// Draw axis lines for each item
		allItems.forEach((item, index) => {
			const angle = anglePerItem * index - Math.PI / 2; // Start from top
			const x = center + radius * Math.cos(angle);
			const y = center + radius * Math.sin(angle);
			
			html += `<line x1="${center}" y1="${center}" x2="${x}" y2="${y}" stroke="#555" stroke-width="1"/>`;
		});
		
		// Draw data polygon
		const points: string[] = [];
		allItems.forEach((item, index) => {
			const value = item.value || 0;
			const normalizedRadius = (radius / maxValue) * value;
			const angle = anglePerItem * index - Math.PI / 2;
			const x = center + normalizedRadius * Math.cos(angle);
			const y = center + normalizedRadius * Math.sin(angle);
			points.push(`${x},${y}`);
		});
		
		html += `<polygon points="${points.join(' ')}" fill="rgba(52, 152, 219, 0.2)" stroke="#3498db" stroke-width="2"/>`;
		
		// Draw data points (colored by category)
		allItems.forEach((item, index) => {
			const value = item.value || 0;
			const normalizedRadius = (radius / maxValue) * value;
			const angle = anglePerItem * index - Math.PI / 2;
			const x = center + normalizedRadius * Math.cos(angle);
			const y = center + normalizedRadius * Math.sin(angle);
			
			html += `<circle cx="${x}" cy="${y}" r="6" fill="${colors[item.category]}" stroke="#ffffff" stroke-width="2"/>`;
		});
		
		// Add labels outside the radar
		const labelDistance = radius + 60;
		allItems.forEach((item, index) => {
			const angle = anglePerItem * index - Math.PI / 2;
			const x = center + labelDistance * Math.cos(angle);
			const y = center + labelDistance * Math.sin(angle);
			
			const emoji = SWOT_EMOJIS[item.category] || '';
			const color = colors[item.category];
			
			// Emoji
			html += `<text x="${x}" y="${y - 20}" text-anchor="middle" fill="${color}" font-size="24">${emoji}</text>`;
			
			// Item name
			html += `<text x="${x}" y="${y}" text-anchor="middle" fill="#ffffff" font-size="14" font-weight="bold">${item.name}</text>`;
			
			// Value
			html += `<text x="${x}" y="${y + 18}" text-anchor="middle" fill="${color}" font-size="16" font-weight="bold">${item.value}</text>`;
		});
		
		html += '</svg>';
		
		// Collapsible Details (hidden by default, click chart to show)
		html += `<div id="${chartId}" style="display: none; flex-direction: column; gap: 20px; font-size: 15px; width: ${size}px;">`;
		
		SWOT_CATEGORIES.forEach(category => {
			const items = groupedData[category];
			if (items.length === 0) return;
			
			const emoji = SWOT_EMOJIS[category] || '';
			const color = colors[category];
			
			// Calculate average for this category
			const sum = items.reduce((acc, item) => acc + item.value, 0);
			const avgValue = sum / items.length;
			
			html += `<div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; border-left: 5px solid ${color};">`;
			html += `<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">`;
			html += `<span style="font-size: 22px;">${emoji}</span>`;
			html += `<strong style="color: ${color}; font-size: 18px;">${category}</strong>`;
			html += `<span style="color: #888; margin-left: auto;">Avg: ${avgValue.toFixed(1)}</span>`;
			html += `</div>`;
			
			// Items grid
			html += `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;">`;
			
			items.forEach(item => {
				html += `
					<div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 6px; border-left: 3px solid ${color};">
						<strong style="color: #fff; font-size: 14px;">${item.name}</strong>
						<span style="color: ${color}; font-weight: bold; font-size: 16px;">${item.value}</span>
					</div>
				`;
			});
			
			html += `</div>`;
			html += `</div>`;
		});
		
		html += '</div>';
		html += '</div>';
		
		return html;
	}

	onunload() {
		// Clear timeout on unload
		if (this.recalculateTimeout) {
			clearTimeout(this.recalculateTimeout);
		}
		// Clear processed elements set
		this.markdownPostProcessors.clear();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class LevelingSettingTab extends PluginSettingTab {
	plugin: LevelingPlugin;

	constructor(app: App, plugin: LevelingPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Leveling System Settings'});

		// Display current stats
		new Setting(containerEl)
			.setName('Current Level')
			.setDesc('Your current level')
			.addText(text => text
				.setValue(String(this.plugin.settings.currentLevel))
				.setDisabled(true));

		new Setting(containerEl)
			.setName('Total EXP')
			.setDesc('Your total experience points')
			.addText(text => text
				.setValue(String(this.plugin.settings.totalExp))
				.setDisabled(true));

		containerEl.createEl('h3', {text: 'EXP Categories'});
		containerEl.createEl('p', {
			text: 'The plugin reads the following properties from your notes YAML frontmatter:'
		});

		const categoryList = containerEl.createEl('ul');
		EXP_CATEGORIES.forEach(category => {
			const li = categoryList.createEl('li');
			li.createEl('strong', {text: category});
			li.appendText(': 1-10 points (each point = 100 EXP)');
		});

		containerEl.createEl('h3', {text: 'Example Note'});
		const exampleCode = containerEl.createEl('pre');
		exampleCode.createEl('code', {
			text: `---
Tasks: 5
Missions: 3
Exploration: 2
Training: 1
Battles: 4
Crafting: 2
---

# My Note

This note gives me:
- Tasks: 5 × 100 = 500 EXP
- Missions: 3 × 100 = 300 EXP
- Exploration: 2 × 100 = 200 EXP
- Training: 1 × 100 = 100 EXP
- Battles: 4 × 100 = 400 EXP
- Crafting: 2 × 100 = 200 EXP

Total from this note: 1700 EXP`
		});

		// Button to recalculate
		new Setting(containerEl)
			.setName('Recalculate EXP')
			.setDesc('Scan all notes and recalculate total EXP')
			.addButton(button => button
				.setButtonText('Recalculate')
				.onClick(async () => {
					await this.plugin.calculateTotalExp();
				}));
	}
}
