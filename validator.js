// JSON-LD Validator
// Validates JSON-LD against schema.org specifications and best practices

class JsonLdValidator {
  constructor() {
    // Common schema.org types and their required properties
    this.schemaRequirements = {
      'Article': ['headline', 'author', 'datePublished'],
      'NewsArticle': ['headline', 'author', 'datePublished'],
      'BlogPosting': ['headline', 'author', 'datePublished'],
      'Product': ['name', 'image'],
      'Organization': ['name'],
      'Person': ['name'],
      'LocalBusiness': ['name', 'address'],
      'Event': ['name', 'startDate', 'location'],
      'Recipe': ['name', 'recipeIngredient', 'recipeInstructions'],
      'VideoObject': ['name', 'description', 'thumbnailUrl', 'uploadDate'],
      'WebSite': ['name', 'url'],
      'WebPage': ['name'],
      'BreadcrumbList': ['itemListElement'],
      'FAQPage': ['mainEntity'],
      'HowTo': ['name', 'step'],
      'Review': ['itemReviewed', 'reviewRating', 'author'],
      'AggregateRating': ['ratingValue', 'reviewCount']
    };

    // Recommended properties for better SEO
    this.recommendedProperties = {
      'Article': ['image', 'publisher', 'dateModified'],
      'Product': ['description', 'offers', 'aggregateRating', 'brand'],
      'Organization': ['logo', 'url', 'sameAs'],
      'Person': ['image', 'jobTitle', 'url'],
      'LocalBusiness': ['telephone', 'priceRange', 'openingHours'],
      'Event': ['description', 'image', 'offers'],
      'Recipe': ['image', 'author', 'datePublished', 'prepTime', 'cookTime'],
      'VideoObject': ['duration', 'contentUrl', 'embedUrl']
    };
  }

  validate(jsonLdData) {
    const results = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
      info: []
    };

    if (!jsonLdData || typeof jsonLdData !== 'object') {
      results.isValid = false;
      results.errors.push({
        type: 'error',
        title: '无效的 JSON-LD 数据',
        message: 'JSON-LD 数据必须是一个有效的对象'
      });
      return results;
    }

    // Check @context
    this.validateContext(jsonLdData, results);

    // Check @type
    this.validateType(jsonLdData, results);

    // Check required properties
    if (jsonLdData['@type']) {
      this.validateRequiredProperties(jsonLdData, results);
      this.checkRecommendedProperties(jsonLdData, results);
    }

    // Check for common issues
    this.checkCommonIssues(jsonLdData, results);

    // Validate nested objects
    this.validateNestedObjects(jsonLdData, results);

    // Check for best practices
    this.checkBestPractices(jsonLdData, results);

    return results;
  }

  validateContext(data, results) {
    if (!data['@context']) {
      results.errors.push({
        type: 'error',
        title: '缺少 @context',
        message: 'JSON-LD 必须包含 @context 属性',
        suggestion: '添加 "@context": "https://schema.org" 到 JSON-LD 对象'
      });
      results.isValid = false;
    } else if (typeof data['@context'] === 'string') {
      if (!data['@context'].includes('schema.org')) {
        results.warnings.push({
          type: 'warning',
          title: '@context 不是 schema.org',
          message: `当前 @context: ${data['@context']}`,
          suggestion: '建议使用 "https://schema.org" 作为 @context'
        });
      }
    }
  }

  validateType(data, results) {
    if (!data['@type']) {
      results.errors.push({
        type: 'error',
        title: '缺少 @type',
        message: 'JSON-LD 必须包含 @type 属性来指定数据类型',
        suggestion: '添加 "@type" 属性,例如: "Article", "Product", "Organization" 等'
      });
      results.isValid = false;
    } else {
      const type = Array.isArray(data['@type']) ? data['@type'][0] : data['@type'];
      results.info.push({
        type: 'info',
        title: `检测到类型: ${type}`,
        message: `正在验证 ${type} 类型的 JSON-LD 数据`
      });
    }
  }

  validateRequiredProperties(data, results) {
    const type = Array.isArray(data['@type']) ? data['@type'][0] : data['@type'];
    const required = this.schemaRequirements[type];

    if (required) {
      const missing = required.filter(prop => !data[prop]);
      
      if (missing.length > 0) {
        results.errors.push({
          type: 'error',
          title: `${type} 缺少必需属性`,
          message: `缺少以下必需属性: ${missing.join(', ')}`,
          suggestion: `请添加这些属性以符合 schema.org 规范`
        });
        results.isValid = false;
      } else {
        results.info.push({
          type: 'info',
          title: '所有必需属性已存在',
          message: `${type} 类型的所有必需属性都已正确定义`
        });
      }
    }
  }

  checkRecommendedProperties(data, results) {
    const type = Array.isArray(data['@type']) ? data['@type'][0] : data['@type'];
    const recommended = this.recommendedProperties[type];

    if (recommended) {
      const missing = recommended.filter(prop => !data[prop]);
      
      if (missing.length > 0) {
        results.suggestions.push({
          type: 'suggestion',
          title: '建议添加更多属性',
          message: `建议添加以下属性以提升 SEO 效果: ${missing.join(', ')}`,
          suggestion: '这些属性虽非必需,但能提供更丰富的信息给搜索引擎'
        });
      }
    }
  }

  checkCommonIssues(data, results) {
    // Check for empty strings
    for (const [key, value] of Object.entries(data)) {
      if (value === '') {
        results.warnings.push({
          type: 'warning',
          title: '空字符串值',
          message: `属性 "${key}" 的值为空字符串`,
          suggestion: '请提供有意义的值或删除该属性'
        });
      }
    }

    // Check URL format
    const urlFields = ['url', 'image', 'logo', 'sameAs', 'contentUrl'];
    for (const field of urlFields) {
      if (data[field]) {
        const urls = Array.isArray(data[field]) ? data[field] : [data[field]];
        urls.forEach(url => {
          if (typeof url === 'string' && !this.isValidUrl(url)) {
            results.warnings.push({
              type: 'warning',
              title: '无效的 URL 格式',
              message: `"${field}" 中的 URL "${url}" 格式可能不正确`,
              suggestion: '确保 URL 以 http:// 或 https:// 开头'
            });
          }
        });
      }
    }

    // Check date format
    const dateFields = ['datePublished', 'dateModified', 'startDate', 'endDate', 'uploadDate'];
    for (const field of dateFields) {
      if (data[field] && typeof data[field] === 'string') {
        if (!this.isValidDate(data[field])) {
          results.warnings.push({
            type: 'warning',
            title: '日期格式问题',
            message: `"${field}" 的值 "${data[field]}" 可能不是有效的 ISO 8601 格式`,
            suggestion: '使用 ISO 8601 格式,例如: 2024-01-01 或 2024-01-01T12:00:00Z'
          });
        }
      }
    }
  }

  validateNestedObjects(data, results, path = '') {
    for (const [key, value] of Object.entries(data)) {
      if (key.startsWith('@')) continue;
      
      const currentPath = path ? `${path}.${key}` : key;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Check if nested object has @type
        if (value['@type']) {
          this.validateType(value, results);
          this.validateRequiredProperties(value, results);
        }
        
        // Recursively validate
        this.validateNestedObjects(value, results, currentPath);
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (typeof item === 'object' && item !== null) {
            this.validateNestedObjects(item, results, `${currentPath}[${index}]`);
          }
        });
      }
    }
  }

  checkBestPractices(data, results) {
    // Check for @id
    if (!data['@id']) {
      results.suggestions.push({
        type: 'suggestion',
        title: '建议添加 @id',
        message: '@id 属性可以唯一标识这个实体',
        suggestion: '添加 "@id" 属性,通常使用页面 URL 或唯一标识符'
      });
    }

    // Check image format
    if (data.image) {
      const images = Array.isArray(data.image) ? data.image : [data.image];
      const hasImageObject = images.some(img => 
        typeof img === 'object' && img['@type'] === 'ImageObject'
      );
      
      if (!hasImageObject && images.length > 0) {
        results.suggestions.push({
          type: 'suggestion',
          title: '图片格式建议',
          message: '建议使用 ImageObject 类型来描述图片',
          suggestion: '使用 {"@type": "ImageObject", "url": "...", "width": ..., "height": ...} 格式'
        });
      }
    }

    // Check for author format
    if (data.author && typeof data.author === 'string') {
      results.suggestions.push({
        type: 'suggestion',
        title: '作者格式建议',
        message: '作者信息建议使用 Person 或 Organization 对象',
        suggestion: '使用 {"@type": "Person", "name": "..."} 格式'
      });
    }

    // Check for publisher in Article types
    const articleTypes = ['Article', 'NewsArticle', 'BlogPosting'];
    const type = Array.isArray(data['@type']) ? data['@type'][0] : data['@type'];
    
    if (articleTypes.includes(type) && data.publisher) {
      if (typeof data.publisher === 'object' && data.publisher.logo) {
        if (typeof data.publisher.logo === 'string') {
          results.suggestions.push({
            type: 'suggestion',
            title: 'Publisher logo 格式建议',
            message: 'Publisher 的 logo 建议使用 ImageObject 格式',
            suggestion: '使用 {"@type": "ImageObject", "url": "..."} 格式'
          });
        }
      }
    }
  }

  isValidUrl(string) {
    try {
      const url = new URL(string);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
      return false;
    }
  }

  isValidDate(dateString) {
    // Check ISO 8601 format
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})?)?$/;
    if (!iso8601Regex.test(dateString)) {
      return false;
    }
    
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  getSummary(results) {
    return {
      total: results.errors.length + results.warnings.length + results.suggestions.length,
      errors: results.errors.length,
      warnings: results.warnings.length,
      suggestions: results.suggestions.length,
      isValid: results.isValid
    };
  }
}

// Export for use in sidepanel
if (typeof module !== 'undefined' && module.exports) {
  module.exports = JsonLdValidator;
}
