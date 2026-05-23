const PROJECT_STATUSES = [
    'PLANNED',
    'IN_PROGRESS',
    'COMPLETED',
    'SUSPENDED',
    'CANCELLED',
];
const PROJECT_REGIONS = [
    'Bissau',
    'Gabu',
    'Bafata',
    'Cacheu',
    'Oio',
    'Quinara',
    'Tombali',
    'Biombo',
    'Bolama',
];
const PROJECT_SECTORS = [
    'Health',
    'Education',
    'Infrastructure',
    'Agriculture',
    'Energy',
    'ICT',
    'Finance',
    'Governance',
    'Environment',
];
function isObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function isEnumValue(value, allowed) {
    return typeof value === 'string' && allowed.includes(value);
}
function readInteger(value, field, options = {}) {
    if (value === undefined) {
        if (options.required) {
            throw new Error(`${field} est requis`);
        }
        return undefined;
    }
    if (typeof value !== 'number' || !Number.isInteger(value)) {
        throw new Error(`${field} doit être un nombre entier`);
    }
    if (options.min !== undefined && value < options.min) {
        throw new Error(`${field} est invalide`);
    }
    if (options.max !== undefined && value > options.max) {
        throw new Error(`${field} est invalide`);
    }
    return value;
}
function readString(value, field, options = {}) {
    if (value === undefined) {
        if (options.required) {
            throw new Error(`${field} est requis`);
        }
        return undefined;
    }
    if (typeof value !== 'string') {
        throw new Error(`${field} est invalide`);
    }
    const trimmed = value.trim();
    if (options.minLength !== undefined && trimmed.length < options.minLength) {
        throw new Error(`${field} est invalide`);
    }
    if (options.maxLength !== undefined && trimmed.length > options.maxLength) {
        throw new Error(`${field} est invalide`);
    }
    return trimmed;
}
function readRequiredDate(value, field) {
    const parsed = new Date(String(value));
    if (value === undefined || Number.isNaN(parsed.getTime())) {
        throw new Error(`${field} doit être une date valide`);
    }
    return parsed;
}
function readOptionalDate(value, field) {
    if (value === undefined) {
        return undefined;
    }
    const parsed = new Date(String(value));
    if (Number.isNaN(parsed.getTime())) {
        throw new Error(`${field} doit être une date valide`);
    }
    return parsed;
}
function parseProjectCreate(data) {
    if (!isObject(data)) {
        throw new Error('Les données projet sont invalides');
    }
    const name = readString(data.name, 'Le nom', { required: true, minLength: 3, maxLength: 255 });
    const budgetXof = readInteger(data.budgetXof, 'Le budget', { required: true, min: 1 });
    const spentXof = readInteger(data.spentXof, 'Les dépenses', { min: 0 }) ?? 0;
    const progress = readInteger(data.progress, "L'avancement", { min: 0, max: 100 }) ?? 0;
    const beneficiaries = readInteger(data.beneficiaries, 'Les bénéficiaires', { min: 0 }) ?? 0;
    const startDate = readRequiredDate(data.startDate, 'La date de début');
    const endDate = readRequiredDate(data.endDate, 'La date de fin');
    if (endDate <= startDate) {
        throw new Error('La date de fin doit être après la date de début');
    }
    return {
        name,
        description: readString(data.description, 'La description', { maxLength: 2000 }) ?? '',
        budgetXof,
        spentXof,
        startDate,
        endDate,
        status: isEnumValue(data.status, PROJECT_STATUSES) ? data.status : 'PLANNED',
        region: isEnumValue(data.region, PROJECT_REGIONS) ? data.region : 'Bissau',
        sector: isEnumValue(data.sector, PROJECT_SECTORS) ? data.sector : 'Governance',
        progress,
        beneficiaries,
        organizationId: readString(data.organizationId, 'Organization ID'),
    };
}
function parseProjectUpdate(data) {
    if (!isObject(data)) {
        throw new Error('Les données projet sont invalides');
    }
    const parsed = {};
    if (data.name !== undefined) {
        parsed.name = readString(data.name, 'Le nom', { minLength: 3, maxLength: 255, required: true });
    }
    if (data.description !== undefined) {
        parsed.description = readString(data.description, 'La description', { maxLength: 2000, required: true });
    }
    if (data.budgetXof !== undefined) {
        parsed.budgetXof = readInteger(data.budgetXof, 'Le budget', { required: true, min: 1 });
    }
    if (data.spentXof !== undefined) {
        parsed.spentXof = readInteger(data.spentXof, 'Les dépenses', { required: true, min: 0 });
    }
    if (data.startDate !== undefined) {
        parsed.startDate = readOptionalDate(data.startDate, 'La date de début');
    }
    if (data.endDate !== undefined) {
        parsed.endDate = readOptionalDate(data.endDate, 'La date de fin');
    }
    if (parsed.startDate && parsed.endDate && parsed.endDate <= parsed.startDate) {
        throw new Error('La date de fin doit être après la date de début');
    }
    if (data.status !== undefined) {
        if (!isEnumValue(data.status, PROJECT_STATUSES)) {
            throw new Error('Statut projet invalide');
        }
        parsed.status = data.status;
    }
    if (data.region !== undefined) {
        if (!isEnumValue(data.region, PROJECT_REGIONS)) {
            throw new Error('Région invalide');
        }
        parsed.region = data.region;
    }
    if (data.sector !== undefined) {
        if (!isEnumValue(data.sector, PROJECT_SECTORS)) {
            throw new Error('Secteur invalide');
        }
        parsed.sector = data.sector;
    }
    if (data.progress !== undefined) {
        parsed.progress = readInteger(data.progress, "L'avancement", { required: true, min: 0, max: 100 });
    }
    if (data.beneficiaries !== undefined) {
        parsed.beneficiaries = readInteger(data.beneficiaries, 'Les bénéficiaires', { required: true, min: 0 });
    }
    if (data.organizationId !== undefined) {
        parsed.organizationId = readString(data.organizationId, 'Organization ID', { required: true });
    }
    return parsed;
}
function parseProjectFilter(data) {
    if (!isObject(data)) {
        return {};
    }
    return {
        search: readString(data.search, 'Recherche'),
        status: isEnumValue(data.status, PROJECT_STATUSES) ? data.status : undefined,
        region: isEnumValue(data.region, PROJECT_REGIONS) ? data.region : undefined,
        sector: isEnumValue(data.sector, PROJECT_SECTORS) ? data.sector : undefined,
        organizationId: readString(data.organizationId, 'Organization ID'),
    };
}
function createSchema(parser) {
    return {
        parse(data) {
            return parser(data);
        },
        safeParse(data) {
            try {
                return { success: true, data: parser(data) };
            }
            catch (error) {
                return {
                    success: false,
                    error: error instanceof Error ? error : new Error('Validation failed'),
                };
            }
        },
    };
}
export const ProjectCreateSchema = createSchema(parseProjectCreate);
export const ProjectUpdateSchema = createSchema(parseProjectUpdate);
export const ProjectFilterSchema = createSchema(parseProjectFilter);
