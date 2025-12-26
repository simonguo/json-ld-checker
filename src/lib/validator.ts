// JSON-LD Validator
// Validates JSON-LD against schema.org specifications and best practices

export interface ValidationResult {
  type: 'error' | 'warning' | 'suggestion' | 'info';
  title: string;
  message: string;
  suggestion?: string;
}

export interface ValidationResults {
  isValid: boolean;
  errors: ValidationResult[];
  warnings: ValidationResult[];
  suggestions: ValidationResult[];
  info: ValidationResult[];
}

export interface ValidationSummary {
  total: number;
  errors: number;
  warnings: number;
  suggestions: number;
  isValid: boolean;
}

const isEnglish = (userLanguage?: string): boolean => {
  // 如果提供了用户语言设置，则优先使用用户设置
  if (userLanguage && userLanguage !== 'auto') {
    return !String(userLanguage).toLowerCase().startsWith('zh');
  }
  
  // 否则使用浏览器语言检测
  const lang = typeof navigator !== 'undefined' ? navigator.language : 'en';
  return !String(lang).toLowerCase().startsWith('zh');
};

export class JsonLdValidator {
  private schemaRequirements: Record<string, string[]> = {
    Article: ['headline', 'author', 'datePublished'],
    NewsArticle: ['headline', 'author', 'datePublished'],
    BlogPosting: ['headline', 'author', 'datePublished'],
    Product: ['name', 'image'],
    Organization: ['name'],
    Person: ['name'],
    LocalBusiness: ['name', 'address'],
    Event: ['name', 'startDate', 'location'],
    Recipe: ['name', 'recipeIngredient', 'recipeInstructions'],
    VideoObject: ['name', 'description', 'thumbnailUrl', 'uploadDate'],
    WebSite: ['name', 'url'],
    WebPage: ['name'],
    BreadcrumbList: ['itemListElement'],
    FAQPage: ['mainEntity'],
    HowTo: ['name', 'step'],
    Review: ['itemReviewed', 'reviewRating', 'author'],
    AggregateRating: ['ratingValue', 'reviewCount'],
  };

  private recommendedProperties: Record<string, string[]> = {
    Article: ['image', 'publisher', 'dateModified', 'mainEntityOfPage'],
    NewsArticle: ['image', 'publisher', 'dateModified', 'mainEntityOfPage'],
    BlogPosting: ['image', 'publisher', 'dateModified', 'mainEntityOfPage'],
    Product: ['description', 'offers', 'aggregateRating', 'brand', 'sku', 'gtin', 'mpn'],
    Organization: ['logo', 'url', 'sameAs', 'contactPoint'],
    Person: ['image', 'jobTitle', 'url', 'sameAs'],
    LocalBusiness: ['telephone', 'priceRange', 'openingHours', 'image', 'geo'],
    Event: ['description', 'image', 'offers', 'performer', 'organizer'],
    Recipe: ['image', 'author', 'datePublished', 'prepTime', 'cookTime', 'recipeYield', 'nutrition'],
    VideoObject: ['duration', 'contentUrl', 'embedUrl', 'interactionStatistic'],
  };

  validate(jsonLdData: any, userLanguage?: string): ValidationResults {
    const eng = isEnglish(userLanguage);
    const results: ValidationResults = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
      info: [],
    };

    if (!jsonLdData || typeof jsonLdData !== 'object') {
      results.isValid = false;
      results.errors.push({
        type: 'error',
        title: eng ? 'Invalid JSON-LD data' : '无效的 JSON-LD 数据',
        message: eng ? 'JSON-LD data must be a valid object' : 'JSON-LD 数据必须是一个有效的对象',
      });
      return results;
    }

    this.validateContext(jsonLdData, results, userLanguage);
    this.validateType(jsonLdData, results, userLanguage);

    if (jsonLdData['@type']) {
      this.validateRequiredProperties(jsonLdData, results, userLanguage);
      this.checkRecommendedProperties(jsonLdData, results, userLanguage);
    }

    this.checkCommonIssues(jsonLdData, results, userLanguage);
    this.validateImageRequirements(jsonLdData, results, userLanguage);
    this.validateTextLengths(jsonLdData, results, userLanguage);
    this.validateRatings(jsonLdData, results, userLanguage);
    this.validatePriceAndOffers(jsonLdData, results, userLanguage);
    this.validateDateLogic(jsonLdData, results, userLanguage);
    this.validateEnumValues(jsonLdData, results, userLanguage);
    this.validateTypeSpecificRules(jsonLdData, results, userLanguage);
    this.validateNestedObjects(jsonLdData, results, userLanguage);
    this.checkBestPractices(jsonLdData, results, userLanguage);

    return results;
  }

  private validateContext(data: any, results: ValidationResults, userLanguage?: string): void {
    const eng = isEnglish(userLanguage);
    if (!data['@context']) {
      results.errors.push({
        type: 'error',
        title: eng ? 'Missing @context' : '缺少 @context',
        message: eng ? 'JSON-LD must include @context property' : 'JSON-LD 必须包含 @context 属性',
        suggestion: eng
          ? 'Add "@context": "https://schema.org" to the JSON-LD object'
          : '添加 "@context": "https://schema.org" 到 JSON-LD 对象',
      });
      results.isValid = false;
    } else if (typeof data['@context'] === 'string' && !data['@context'].includes('schema.org')) {
      results.warnings.push({
        type: 'warning',
        title: eng ? '@context is not schema.org' : '@context 不是 schema.org',
        message: `${eng ? 'Current @context:' : '当前 @context:'} ${data['@context']}`,
        suggestion: eng ? 'Recommend using "https://schema.org" as @context' : '建议使用 "https://schema.org" 作为 @context',
      });
    }
  }

  private validateType(data: any, results: ValidationResults, userLanguage?: string): void {
    const eng = isEnglish(userLanguage);
    if (!data['@type']) {
      results.errors.push({
        type: 'error',
        title: eng ? 'Missing @type' : '缺少 @type',
        message: eng ? 'JSON-LD must include @type property to specify data type' : 'JSON-LD 必须包含 @type 属性来指定数据类型',
        suggestion: eng
          ? 'Add "@type" property, e.g.: "Article", "Product", "Organization"'
          : '添加 "@type" 属性,例如: "Article", "Product", "Organization" 等',
      });
      results.isValid = false;
    } else {
      const type = Array.isArray(data['@type']) ? data['@type'][0] : data['@type'];
      results.info.push({
        type: 'info',
        title: eng ? `Detected type: ${type}` : `检测到类型: ${type}`,
        message: eng ? `Validating ${type} type JSON-LD data` : `正在验证 ${type} 类型的 JSON-LD 数据`,
      });
    }
  }

  private validateRequiredProperties(data: any, results: ValidationResults, userLanguage?: string): void {
    const eng = isEnglish(userLanguage);
    const type = Array.isArray(data['@type']) ? data['@type'][0] : data['@type'];
    const required = this.schemaRequirements[type];

    if (required) {
      const missing = required.filter((prop) => !data[prop]);

      if (missing.length > 0) {
        results.errors.push({
          type: 'error',
          title: eng ? `${type} missing required properties` : `${type} 缺少必需属性`,
          message: eng ? `Missing required properties: ${missing.join(', ')}` : `缺少以下必需属性: ${missing.join(', ')}`,
          suggestion: eng ? 'Add these properties to comply with schema.org specification' : '请添加这些属性以符合 schema.org 规范',
        });
        results.isValid = false;
      } else {
        results.info.push({
          type: 'info',
          title: eng ? 'All required properties present' : '所有必需属性已存在',
          message: eng ? `All required properties for ${type} are correctly defined` : `${type} 类型的所有必需属性都已正确定义`,
        });
      }
    }
  }

  private checkRecommendedProperties(data: any, results: ValidationResults, userLanguage?: string): void {
    const eng = isEnglish(userLanguage);
    const type = Array.isArray(data['@type']) ? data['@type'][0] : data['@type'];
    const recommended = this.recommendedProperties[type];

    if (recommended) {
      const missing = recommended.filter((prop) => !data[prop]);

      if (missing.length > 0) {
        results.suggestions.push({
          type: 'suggestion',
          title: eng ? 'Recommend adding more properties' : '建议添加更多属性',
          message: eng
            ? `Recommend adding these properties for better SEO: ${missing.join(', ')}`
            : `建议添加以下属性以提升 SEO 效果: ${missing.join(', ')}`,
          suggestion: eng
            ? 'These properties are not required but provide richer information to search engines'
            : '这些属性虽非必需,但能提供更丰富的信息给搜索引擎',
        });
      }
    }
  }

  private checkCommonIssues(data: any, results: ValidationResults, userLanguage?: string): void {
    const eng = isEnglish(userLanguage);
    for (const [key, value] of Object.entries(data)) {
      if (value === '') {
        results.warnings.push({
          type: 'warning',
          title: eng ? 'Empty string value' : '空字符串值',
          message: eng ? `Property "${key}" has empty string value` : `属性 "${key}" 的值为空字符串`,
          suggestion: eng ? 'Provide a meaningful value or remove this property' : '请提供有意义的值或删除该属性',
        });
      }
    }

    const urlFields = ['url', 'image', 'logo', 'sameAs', 'contentUrl'];
    for (const field of urlFields) {
      if (data[field]) {
        const urls = Array.isArray(data[field]) ? data[field] : [data[field]];
        urls.forEach((url: any) => {
          if (typeof url === 'string' && !this.isValidUrl(url)) {
            results.warnings.push({
              type: 'warning',
              title: eng ? 'Invalid URL format' : '无效的 URL 格式',
              message: eng ? `URL "${url}" in "${field}" may be invalid` : `"${field}" 中的 URL "${url}" 格式可能不正确`,
              suggestion: eng ? 'Ensure URL starts with http:// or https://' : '确保 URL 以 http:// 或 https:// 开头',
            });
          }
        });
      }
    }

    const dateFields = ['datePublished', 'dateModified', 'startDate', 'endDate', 'uploadDate'];
    for (const field of dateFields) {
      if (data[field] && typeof data[field] === 'string' && !this.isValidDate(data[field])) {
        results.warnings.push({
          type: 'warning',
          title: eng ? 'Date format issue' : '日期格式问题',
          message: eng
            ? `"${field}" value "${data[field]}" may not be valid ISO 8601 format`
            : `"${field}" 的值 "${data[field]}" 可能不是有效的 ISO 8601 格式`,
          suggestion: eng ? 'Use ISO 8601 format, e.g.: 2024-01-01 or 2024-01-01T12:00:00Z' : '使用 ISO 8601 格式,例如: 2024-01-01 或 2024-01-01T12:00:00Z',
        });
      }
    }
  }

  private validateNestedObjects(data: any, results: ValidationResults, userLanguage?: string, path = ''): void {
    const eng = isEnglish(userLanguage);
    for (const [key, value] of Object.entries(data)) {
      if (key.startsWith('@')) continue;

      const currentPath = path ? `${path}.${key}` : key;

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        if ((value as any)['@type']) {
          this.validateType(value, results, userLanguage);
          this.validateRequiredProperties(value, results, userLanguage);
        }
        this.validateNestedObjects(value, results, userLanguage, currentPath);
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (typeof item === 'object' && item !== null) {
            this.validateNestedObjects(item, results, userLanguage, `${currentPath}[${index}]`);
          }
        });
      }
    }
  }

  private validateImageRequirements(data: any, results: ValidationResults, userLanguage?: string): void {
    const eng = isEnglish(userLanguage);
    const type = Array.isArray(data['@type']) ? data['@type'][0] : data['@type'];
    
    // Google recommends images for rich results
    const typesNeedingImages = ['Article', 'NewsArticle', 'BlogPosting', 'Product', 'Recipe', 'VideoObject', 'Event'];
    
    if (typesNeedingImages.includes(type) && data.image) {
      const images = Array.isArray(data.image) ? data.image : [data.image];
      
      images.forEach((img: any) => {
        const imageUrl = typeof img === 'string' ? img : img?.url;
        
        if (typeof img === 'object' && img['@type'] === 'ImageObject') {
          // Check image dimensions
          if (!img.width || !img.height) {
            results.warnings.push({
              type: 'warning',
              title: eng ? 'Missing image dimensions' : '缺少图片尺寸',
              message: eng ? 'ImageObject should include width and height properties' : 'ImageObject 应该包含 width 和 height 属性',
              suggestion: eng ? 'Google recommends images at least 1200px wide' : 'Google 建议图片宽度至少 1200px',
            });
          } else if (img.width < 1200) {
            results.suggestions.push({
              type: 'suggestion',
              title: eng ? 'Image width recommendation' : '图片宽度建议',
              message: eng ? `Image width is ${img.width}px, recommended minimum is 1200px` : `图片宽度为 ${img.width}px，建议最小宽度为 1200px`,
            });
          }
        }
      });
    }
  }

  private validateTextLengths(data: any, results: ValidationResults, userLanguage?: string): void {
    const eng = isEnglish(userLanguage);
    
    // Headline length (Google recommends under 110 characters)
    if (data.headline && typeof data.headline === 'string') {
      if (data.headline.length > 110) {
        results.warnings.push({
          type: 'warning',
          title: eng ? 'Headline too long' : '标题过长',
          message: eng 
            ? `Headline is ${data.headline.length} characters, Google recommends maximum 110 characters`
            : `标题长度为 ${data.headline.length} 字符，Google 建议最多 110 字符`,
          suggestion: eng ? 'Shorten the headline for better display in search results' : '缩短标题以便在搜索结果中更好地显示',
        });
      }
    }
    
    // Name length for various types
    if (data.name && typeof data.name === 'string' && data.name.length > 200) {
      results.suggestions.push({
        type: 'suggestion',
        title: eng ? 'Name is very long' : 'Name 过长',
        message: eng ? `Name is ${data.name.length} characters, consider shortening` : `Name 长度为 ${data.name.length} 字符，建议缩短`,
      });
    }
    
    // Description length
    if (data.description && typeof data.description === 'string') {
      if (data.description.length < 50) {
        results.suggestions.push({
          type: 'suggestion',
          title: eng ? 'Description too short' : '描述过短',
          message: eng ? 'Description should be at least 50 characters for better SEO' : '描述应至少 50 字符以获得更好的 SEO 效果',
        });
      } else if (data.description.length > 5000) {
        results.warnings.push({
          type: 'warning',
          title: eng ? 'Description too long' : '描述过长',
          message: eng ? 'Description exceeds 5000 characters, may be truncated' : '描述超过 5000 字符，可能会被截断',
        });
      }
    }
  }

  private validateRatings(data: any, results: ValidationResults, userLanguage?: string): void {
    const eng = isEnglish(userLanguage);
    
    // Validate AggregateRating
    if (data.aggregateRating && typeof data.aggregateRating === 'object') {
      const rating = data.aggregateRating;
      
      if (rating.ratingValue !== undefined) {
        const value = Number(rating.ratingValue);
        const bestRating = Number(rating.bestRating || 5);
        const worstRating = Number(rating.worstRating || 1);
        
        if (isNaN(value)) {
          results.errors.push({
            type: 'error',
            title: eng ? 'Invalid rating value' : '无效的评分值',
            message: eng ? 'ratingValue must be a number' : 'ratingValue 必须是数字',
          });
        } else if (value < worstRating || value > bestRating) {
          results.errors.push({
            type: 'error',
            title: eng ? 'Rating out of range' : '评分超出范围',
            message: eng 
              ? `ratingValue (${value}) must be between worstRating (${worstRating}) and bestRating (${bestRating})`
              : `ratingValue (${value}) 必须在 worstRating (${worstRating}) 和 bestRating (${bestRating}) 之间`,
          });
        }
      }
      
      if (rating.reviewCount !== undefined) {
        const count = Number(rating.reviewCount);
        if (isNaN(count) || count < 0 || !Number.isInteger(count)) {
          results.errors.push({
            type: 'error',
            title: eng ? 'Invalid review count' : '无效的评论数',
            message: eng ? 'reviewCount must be a positive integer' : 'reviewCount 必须是正整数',
          });
        }
      }
    }
    
    // Validate Review rating
    if (data.reviewRating && typeof data.reviewRating === 'object') {
      const rating = data.reviewRating;
      if (rating.ratingValue !== undefined) {
        const value = Number(rating.ratingValue);
        const bestRating = Number(rating.bestRating || 5);
        const worstRating = Number(rating.worstRating || 1);
        
        if (value < worstRating || value > bestRating) {
          results.errors.push({
            type: 'error',
            title: eng ? 'Review rating out of range' : '评论评分超出范围',
            message: eng 
              ? `Review ratingValue must be between ${worstRating} and ${bestRating}`
              : `评论的 ratingValue 必须在 ${worstRating} 和 ${bestRating} 之间`,
          });
        }
      }
    }
  }

  private validatePriceAndOffers(data: any, results: ValidationResults, userLanguage?: string): void {
    const eng = isEnglish(userLanguage);
    
    const validateOffer = (offer: any, index?: number) => {
      const prefix = index !== undefined ? `offers[${index}]` : 'offers';
      
      if (offer.price !== undefined) {
        const price = String(offer.price);
        if (!/^\d+(\.\d{1,2})?$/.test(price)) {
          results.warnings.push({
            type: 'warning',
            title: eng ? 'Price format issue' : '价格格式问题',
            message: eng ? `${prefix}.price should be a valid decimal number` : `${prefix}.price 应该是有效的小数`,
            suggestion: eng ? 'Use format like "19.99" or "100"' : '使用 "19.99" 或 "100" 等格式',
          });
        }
      }
      
      if (offer.priceCurrency) {
        const currency = String(offer.priceCurrency).toUpperCase();
        // Common ISO 4217 currencies
        const validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'AUD', 'CAD', 'CHF', 'HKD', 'SGD', 'KRW', 'INR'];
        if (currency.length !== 3) {
          results.warnings.push({
            type: 'warning',
            title: eng ? 'Invalid currency code' : '无效的货币代码',
            message: eng ? `priceCurrency should be ISO 4217 format (3 letters)` : 'priceCurrency 应该是 ISO 4217 格式（3个字母）',
          });
        }
      }
      
      if (offer.availability) {
        const validAvailability = [
          'InStock', 'OutOfStock', 'PreOrder', 'Discontinued', 'InStoreOnly',
          'LimitedAvailability', 'OnlineOnly', 'PreSale', 'SoldOut', 'BackOrder'
        ];
        const availability = String(offer.availability).replace('https://schema.org/', '');
        if (!validAvailability.includes(availability)) {
          results.warnings.push({
            type: 'warning',
            title: eng ? 'Invalid availability value' : '无效的库存状态值',
            message: eng 
              ? `availability "${offer.availability}" is not a valid schema.org value`
              : `availability "${offer.availability}" 不是有效的 schema.org 值`,
            suggestion: eng 
              ? `Use values like: ${validAvailability.join(', ')}`
              : `使用如下值: ${validAvailability.join(', ')}`,
          });
        }
      }
    };
    
    if (data.offers) {
      if (Array.isArray(data.offers)) {
        data.offers.forEach((offer: any, index: number) => {
          if (typeof offer === 'object') validateOffer(offer, index);
        });
      } else if (typeof data.offers === 'object') {
        validateOffer(data.offers);
      }
    }
  }

  private validateDateLogic(data: any, results: ValidationResults, userLanguage?: string): void {
    const eng = isEnglish(userLanguage);
    
    // dateModified should be >= datePublished
    if (data.datePublished && data.dateModified) {
      const published = new Date(data.datePublished);
      const modified = new Date(data.dateModified);
      
      if (!isNaN(published.getTime()) && !isNaN(modified.getTime())) {
        if (modified < published) {
          results.errors.push({
            type: 'error',
            title: eng ? 'Date logic error' : '日期逻辑错误',
            message: eng 
              ? 'dateModified cannot be earlier than datePublished'
              : 'dateModified 不能早于 datePublished',
          });
        }
      }
    }
    
    // Event: endDate should be >= startDate
    if (data.startDate && data.endDate) {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        if (end < start) {
          results.errors.push({
            type: 'error',
            title: eng ? 'Event date error' : '活动日期错误',
            message: eng 
              ? 'endDate cannot be earlier than startDate'
              : 'endDate 不能早于 startDate',
          });
        }
      }
    }
    
    // uploadDate should not be in the future (for VideoObject)
    if (data.uploadDate && data['@type'] === 'VideoObject') {
      const upload = new Date(data.uploadDate);
      const now = new Date();
      
      if (!isNaN(upload.getTime()) && upload > now) {
        results.warnings.push({
          type: 'warning',
          title: eng ? 'Future upload date' : '未来的上传日期',
          message: eng 
            ? 'uploadDate is in the future, which may not be valid'
            : 'uploadDate 是未来的日期，可能无效',
        });
      }
    }
  }

  private validateEnumValues(data: any, results: ValidationResults, userLanguage?: string): void {
    const eng = isEnglish(userLanguage);
    
    // Event status
    if (data.eventStatus) {
      const validStatuses = [
        'EventCancelled', 'EventMovedOnline', 'EventPostponed', 
        'EventRescheduled', 'EventScheduled'
      ];
      const status = String(data.eventStatus).replace('https://schema.org/', '');
      if (!validStatuses.includes(status)) {
        results.warnings.push({
          type: 'warning',
          title: eng ? 'Invalid event status' : '无效的活动状态',
          message: eng 
            ? `eventStatus should be one of: ${validStatuses.join(', ')}`
            : `eventStatus 应该是以下之一: ${validStatuses.join(', ')}`,
        });
      }
    }
    
    // Event attendance mode
    if (data.eventAttendanceMode) {
      const validModes = [
        'OfflineEventAttendanceMode', 'OnlineEventAttendanceMode', 'MixedEventAttendanceMode'
      ];
      const mode = String(data.eventAttendanceMode).replace('https://schema.org/', '');
      if (!validModes.includes(mode)) {
        results.warnings.push({
          type: 'warning',
          title: eng ? 'Invalid attendance mode' : '无效的参与模式',
          message: eng 
            ? `eventAttendanceMode should be one of: ${validModes.join(', ')}`
            : `eventAttendanceMode 应该是以下之一: ${validModes.join(', ')}`,
        });
      }
    }
  }

  private validateTypeSpecificRules(data: any, results: ValidationResults, userLanguage?: string): void {
    const eng = isEnglish(userLanguage);
    const type = Array.isArray(data['@type']) ? data['@type'][0] : data['@type'];
    
    // Article types must have publisher with logo
    const articleTypes = ['Article', 'NewsArticle', 'BlogPosting'];
    if (articleTypes.includes(type)) {
      if (!data.publisher) {
        results.errors.push({
          type: 'error',
          title: eng ? 'Missing publisher' : '缺少 publisher',
          message: eng ? `${type} must have a publisher property` : `${type} 必须有 publisher 属性`,
        });
      } else if (typeof data.publisher === 'object' && !data.publisher.logo) {
        results.errors.push({
          type: 'error',
          title: eng ? 'Publisher missing logo' : 'Publisher 缺少 logo',
          message: eng ? 'Publisher must have a logo property for Article types' : 'Article 类型的 Publisher 必须有 logo 属性',
        });
      }
    }
    
    // BreadcrumbList validation
    if (type === 'BreadcrumbList' && data.itemListElement) {
      if (Array.isArray(data.itemListElement)) {
        const positions = data.itemListElement.map((item: any) => item.position);
        const hasInvalidPosition = positions.some((pos: any) => 
          pos === undefined || !Number.isInteger(Number(pos)) || Number(pos) < 1
        );
        
        if (hasInvalidPosition) {
          results.errors.push({
            type: 'error',
            title: eng ? 'Invalid breadcrumb position' : '无效的面包屑位置',
            message: eng 
              ? 'Each breadcrumb item must have a position property (positive integer starting from 1)'
              : '每个面包屑项必须有 position 属性（从 1 开始的正整数）',
          });
        }
        
        // Check if positions are sequential
        const sortedPositions = [...positions].sort((a, b) => Number(a) - Number(b));
        const isSequential = sortedPositions.every((pos, idx) => Number(pos) === idx + 1);
        if (!isSequential) {
          results.warnings.push({
            type: 'warning',
            title: eng ? 'Non-sequential positions' : '位置不连续',
            message: eng 
              ? 'Breadcrumb positions should be sequential (1, 2, 3, ...)'
              : '面包屑位置应该是连续的（1, 2, 3, ...）',
          });
        }
      }
    }
    
    // FAQPage validation
    if (type === 'FAQPage' && data.mainEntity) {
      if (Array.isArray(data.mainEntity)) {
        data.mainEntity.forEach((item: any, index: number) => {
          if (item['@type'] !== 'Question') {
            results.warnings.push({
              type: 'warning',
              title: eng ? 'Invalid FAQ item type' : '无效的 FAQ 项类型',
              message: eng 
                ? `mainEntity[${index}] should be of type "Question"`
                : `mainEntity[${index}] 应该是 "Question" 类型`,
            });
          }
          
          if (!item.acceptedAnswer) {
            results.errors.push({
              type: 'error',
              title: eng ? 'Question missing answer' : 'Question 缺少答案',
              message: eng 
                ? `Question at index ${index} must have acceptedAnswer`
                : `索引 ${index} 的 Question 必须有 acceptedAnswer`,
            });
          }
        });
      }
    }
    
    // VideoObject duration format
    if (type === 'VideoObject' && data.duration) {
      // ISO 8601 duration format: PT#H#M#S
      const iso8601DurationRegex = /^P(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/;
      if (!iso8601DurationRegex.test(data.duration)) {
        results.errors.push({
          type: 'error',
          title: eng ? 'Invalid duration format' : '无效的时长格式',
          message: eng 
            ? `duration must be in ISO 8601 format (e.g., "PT1H30M" for 1 hour 30 minutes)`
            : `duration 必须是 ISO 8601 格式（例如 "PT1H30M" 表示 1小时30分钟）`,
        });
      }
    }
    
    // HowTo steps validation
    if (type === 'HowTo' && data.step) {
      const steps = Array.isArray(data.step) ? data.step : [data.step];
      steps.forEach((step: any, index: number) => {
        if (typeof step === 'object' && step['@type'] && step['@type'] !== 'HowToStep') {
          results.warnings.push({
            type: 'warning',
            title: eng ? 'Invalid step type' : '无效的步骤类型',
            message: eng 
              ? `step[${index}] should be of type "HowToStep"`
              : `step[${index}] 应该是 "HowToStep" 类型`,
          });
        }
      });
    }
  }

  private checkBestPractices(data: any, results: ValidationResults, userLanguage?: string): void {
    const eng = isEnglish(userLanguage);
    if (!data['@id']) {
      results.suggestions.push({
        type: 'suggestion',
        title: eng ? 'Recommend adding @id' : '建议添加 @id',
        message: eng ? '@id property can uniquely identify this entity' : '@id 属性可以唯一标识这个实体',
        suggestion: eng ? 'Add "@id" property, usually using page URL or unique identifier' : '添加 "@id" 属性,通常使用页面 URL 或唯一标识符',
      });
    }

    if (data.image) {
      const images = Array.isArray(data.image) ? data.image : [data.image];
      const hasImageObject = images.some((img: any) => typeof img === 'object' && img['@type'] === 'ImageObject');

      if (!hasImageObject && images.length > 0) {
        results.suggestions.push({
          type: 'suggestion',
          title: eng ? 'Image format suggestion' : '图片格式建议',
          message: eng ? 'Recommend using ImageObject type to describe images' : '建议使用 ImageObject 类型来描述图片',
          suggestion: eng
            ? 'Use {"@type": "ImageObject", "url": "...", "width": ..., "height": ...} format'
            : '使用 {"@type": "ImageObject", "url": "...", "width": ..., "height": ...} 格式',
        });
      }
    }

    if (data.author && typeof data.author === 'string') {
      results.suggestions.push({
        type: 'suggestion',
        title: eng ? 'Author format suggestion' : '作者格式建议',
        message: eng ? 'Recommend using Person or Organization object for author' : '作者信息建议使用 Person 或 Organization 对象',
        suggestion: eng ? 'Use {"@type": "Person", "name": "..."} format' : '使用 {"@type": "Person", "name": "..."} 格式',
      });
    }

    const articleTypes = ['Article', 'NewsArticle', 'BlogPosting'];
    const type = Array.isArray(data['@type']) ? data['@type'][0] : data['@type'];

    if (articleTypes.includes(type) && data.publisher?.logo && typeof data.publisher.logo === 'string') {
      results.suggestions.push({
        type: 'suggestion',
        title: eng ? 'Publisher logo format suggestion' : 'Publisher logo 格式建议',
        message: eng ? 'Publisher logo should use ImageObject format' : 'Publisher 的 logo 建议使用 ImageObject 格式',
        suggestion: eng ? 'Use {"@type": "ImageObject", "url": "..."} format' : '使用 {"@type": "ImageObject", "url": "..."} 格式',
      });
    }
  }

  private isValidUrl(string: string): boolean {
    try {
      const url = new URL(string);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  private isValidDate(dateString: string): boolean {
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})?)?$/;
    if (!iso8601Regex.test(dateString)) {
      return false;
    }
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  getSummary(results: ValidationResults): ValidationSummary {
    return {
      total: results.errors.length + results.warnings.length + results.suggestions.length,
      errors: results.errors.length,
      warnings: results.warnings.length,
      suggestions: results.suggestions.length,
      isValid: results.isValid,
    };
  }
}

// Singleton instance
export const validator = new JsonLdValidator();
