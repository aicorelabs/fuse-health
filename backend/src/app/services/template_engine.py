"""
Enhanced Template Engine for Workflow Variable Resolution

Provides powerful template functions for accessing and transforming JSON data
from workflow node outputs, similar to Jinja2/Handlebars.

Supported Features:
- JSONPath-like queries: $.data.items[*].name
- Helper functions: {{json_get}}, {{json_query}}, {{filter}}, {{map}}
- Conditional logic: {{if}}, {{else}}, {{endif}}
- Data transformations: {{format_date}}, {{uppercase}}, {{join}}
- Math operations: {{sum}}, {{avg}}, {{round}}
- Array operations: {{first}}, {{last}}, {{slice}}, {{length}}

Example Usage:
    # Simple variable
    "${email}" → "user@example.com"
    
    # Nested path
    "${node_abc_result.data.items[0].name}" → "First Item"
    
    # Helper function
    "{{json_get node_abc_result 'data.items[*].name'}}" → ["Item1", "Item2"]
    
    # Conditional
    "{{if node_abc_result.success}}Success!{{else}}Failed{{endif}}"
    
    # Transformation
    "{{uppercase ${user.name}}}" → "JOHN DOE"
"""

import json
import re
from datetime import datetime
from typing import Any, Dict, List, Optional, Callable
import jsonpath_ng
from jsonpath_ng import parse


class TemplateEngine:
    """Enhanced template engine with helper functions for JSON access."""

    def __init__(self):
        """Initialize template engine with helper functions."""
        self.helpers: Dict[str, Callable] = {
            # JSON Operations
            'json_get': self._json_get,
            'json_query': self._json_query,
            'json_path': self._json_path,
            'parse_json': self._parse_json,
            'to_json': self._to_json,

            # Array Operations
            'first': self._first,
            'last': self._last,
            'slice': self._slice,
            'length': self._length,
            'join': self._join,
            'filter': self._filter,
            'map': self._map,
            'pluck': self._pluck,
            'unique': self._unique,
            'flatten': self._flatten,
            'sort': self._sort,

            # String Operations
            'uppercase': self._uppercase,
            'lowercase': self._lowercase,
            'capitalize': self._capitalize,
            'trim': self._trim,
            'split': self._split,
            'replace': self._replace,
            'substring': self._substring,
            'concat': self._concat,

            # Conditional Operations
            'if': self._if,
            'default': self._default,
            'is_empty': self._is_empty,
            'is_null': self._is_null,
            'equals': self._equals,

            # Math Operations
            'sum': self._sum,
            'avg': self._avg,
            'min': self._min,
            'max': self._max,
            'round': self._round,
            'floor': self._floor,
            'ceil': self._ceil,

            # Date Operations
            'format_date': self._format_date,
            'now': self._now,
            'date_diff': self._date_diff,

            # Type Conversion
            'to_string': self._to_string,
            'to_number': self._to_number,
            'to_boolean': self._to_boolean,
        }

    def resolve(self, template: Any, context: Dict[str, Any]) -> Any:
        """
        Resolve template with context variables.

        Args:
            template: Template string, dict, or value
            context: Variables available for resolution

        Returns:
            Resolved value
        """
        if isinstance(template, str):
            return self._resolve_string(template, context)
        elif isinstance(template, dict):
            return {k: self.resolve(v, context) for k, v in template.items()}
        elif isinstance(template, list):
            return [self.resolve(item, context) for item in template]
        else:
            return template

    def _resolve_string(self, text: str, context: Dict[str, Any]) -> Any:
        """Resolve a template string."""
        # First, resolve helper functions: {{helper_name args}}
        text = self._resolve_helpers(text, context)

        # Then, resolve variable substitutions: ${variable.path}
        text = self._resolve_variables(text, context)

        return text

    def _resolve_variables(self, text: str, context: Dict[str, Any]) -> Any:
        """
        Resolve ${variable.path} style references.

        Supports:
        - Simple: ${email}
        - Nested: ${user.profile.name}
        - Array index: ${items[0].name}
        - Array wildcard: ${items[*].name}
        """
        pattern = r'\$\{([^}]+)\}'

        # Check if entire string is a single variable
        if text.strip().startswith('${') and text.strip().endswith('}') and text.count('${') == 1:
            path = text.strip()[2:-1]
            value = self._get_value_by_path(path, context)
            return value if value is not None else text

        # Replace all variables in string
        def replacer(match):
            path = match.group(1)
            value = self._get_value_by_path(path, context)

            if value is None:
                return match.group(0)  # Keep original if not found

            return str(value) if not isinstance(value, (dict, list)) else json.dumps(value)

        return re.sub(pattern, replacer, text)

    def _resolve_helpers(self, text: str, context: Dict[str, Any]) -> str:
        """
        Resolve {{helper_name args}} style function calls.

        Examples:
        - {{json_get node_result 'data.items'}}
        - {{uppercase ${user.name}}}
        - {{if ${count} > 0}}Yes{{else}}No{{endif}}
        """
        # Pattern to match {{helper_name args}}
        pattern = r'\{\{([^}]+)\}\}'

        def replacer(match):
            expr = match.group(1).strip()

            # Parse helper name and arguments
            parts = self._parse_helper_expression(expr)
            if not parts:
                return match.group(0)

            helper_name = parts[0]
            args = parts[1:]

            # Get helper function
            helper_func = self.helpers.get(helper_name)
            if not helper_func:
                return match.group(0)

            # Resolve arguments
            resolved_args = []
            for arg in args:
                # First resolve any ${var} in the argument
                resolved_arg = self._resolve_variables(arg, context)
                # Then try to parse as literal
                resolved_args.append(self._parse_literal(resolved_arg))

            # Call helper
            try:
                result = helper_func(context, *resolved_args)
                return str(result) if not isinstance(result, str) else result
            except Exception as e:
                print(f"Helper error: {helper_name} - {e}")
                return match.group(0)

        return re.sub(pattern, replacer, text)

    def _get_value_by_path(self, path: str, context: Dict[str, Any]) -> Any:
        """
        Get value from context by path.

        Supports:
        - Simple: email
        - Nested: user.profile.name
        - Array index: items[0].name
        - Array wildcard: items[*].name (returns list)
        """
        # Handle array notation: items[0] or items[*]
        parts = re.split(r'[\.\[]', path)
        value = context

        for part in parts:
            if not part:
                continue

            # Handle array index
            if part.endswith(']'):
                index = part[:-1]

                if index == '*':
                    # Wildcard - continue path for all items
                    if isinstance(value, list):
                        remaining = '.'.join(parts[parts.index(part)+1:])
                        if remaining:
                            return [self._get_value_by_path(remaining, {'root': item})['root']
                                    for item in value]
                        return value
                    return None

                elif index.isdigit():
                    # Numeric index
                    if isinstance(value, (list, tuple)):
                        idx = int(index)
                        if 0 <= idx < len(value):
                            value = value[idx]
                        else:
                            return None
                    else:
                        return None
                else:
                    return None
            else:
                # Regular property access
                if isinstance(value, dict):
                    value = value.get(part)
                else:
                    return None

            if value is None:
                return None

        return value

    def _parse_helper_expression(self, expr: str) -> List[str]:
        """
        Parse helper expression into name and arguments.

        Examples:
        - "json_get node_result 'data.items'"
        - "uppercase 'hello world'"
        - "if count > 5"
        """
        # Split by spaces, but respect quotes
        parts = []
        current = []
        in_quotes = False
        quote_char = None

        for char in expr:
            if char in ('"', "'") and not in_quotes:
                in_quotes = True
                quote_char = char
            elif char == quote_char and in_quotes:
                in_quotes = False
                quote_char = None
            elif char == ' ' and not in_quotes:
                if current:
                    parts.append(''.join(current))
                    current = []
            else:
                current.append(char)

        if current:
            parts.append(''.join(current))

        return parts

    def _parse_literal(self, value: str) -> Any:
        """Parse a literal value (string, number, boolean)."""
        # Remove quotes if present
        if value.startswith(("'", '"')) and value.endswith(("'", '"')):
            return value[1:-1]

        # Try to parse as number
        try:
            if '.' in value:
                return float(value)
            return int(value)
        except ValueError:
            pass

        # Parse boolean
        if value.lower() == 'true':
            return True
        if value.lower() == 'false':
            return False
        if value.lower() == 'null':
            return None

        return value

    # ==================== JSON Operations ====================

    def _json_get(self, context: Dict, obj_name: str, path: str) -> Any:
        """
        Get value from JSON object by path.

        Example: {{json_get node_result 'data.items[0].name'}}
        """
        obj = context.get(obj_name)
        if obj is None:
            return None

        return self._get_value_by_path(path, {obj_name: obj})

    def _json_query(self, context: Dict, obj_name: str, jsonpath: str) -> Any:
        """
        Query JSON using JSONPath syntax.

        Example: {{json_query node_result '$.data.items[?(@.price > 10)]'}}
        """
        obj = context.get(obj_name)
        if obj is None:
            return None

        try:
            jsonpath_expr = parse(jsonpath)
            matches = [match.value for match in jsonpath_expr.find(obj)]
            return matches if len(matches) != 1 else matches[0]
        except Exception:
            return None

    def _json_path(self, context: Dict, obj_name: str, path: str) -> Any:
        """Alias for json_query."""
        return self._json_query(context, obj_name, path)

    def _parse_json(self, context: Dict, json_string: str) -> Any:
        """
        Parse JSON string to object.

        Example: {{parse_json '{"name": "John"}'}}
        """
        try:
            return json.loads(json_string)
        except Exception:
            return None

    def _to_json(self, context: Dict, value: Any) -> str:
        """
        Convert value to JSON string.

        Example: {{to_json ${user_data}}}
        """
        try:
            return json.dumps(value)
        except Exception:
            return str(value)

    # ==================== Array Operations ====================

    def _first(self, context: Dict, array: Any) -> Any:
        """Get first item from array."""
        if isinstance(array, (list, tuple)) and len(array) > 0:
            return array[0]
        return None

    def _last(self, context: Dict, array: Any) -> Any:
        """Get last item from array."""
        if isinstance(array, (list, tuple)) and len(array) > 0:
            return array[-1]
        return None

    def _slice(self, context: Dict, array: Any, start: int, end: Optional[int] = None) -> List:
        """Slice array."""
        if isinstance(array, (list, tuple)):
            return list(array[start:end])
        return []

    def _length(self, context: Dict, value: Any) -> int:
        """Get length of array or string."""
        if isinstance(value, (list, tuple, str, dict)):
            return len(value)
        return 0

    def _join(self, context: Dict, array: Any, separator: str = ',') -> str:
        """Join array items with separator."""
        if isinstance(array, (list, tuple)):
            return separator.join(str(item) for item in array)
        return str(array)

    def _filter(self, context: Dict, array: Any, key: str, value: Any) -> List:
        """Filter array by key-value match."""
        if not isinstance(array, (list, tuple)):
            return []

        return [item for item in array
                if isinstance(item, dict) and item.get(key) == value]

    def _map(self, context: Dict, array: Any, key: str) -> List:
        """Map array to extract specific key from each item."""
        if not isinstance(array, (list, tuple)):
            return []

        return [item.get(key) if isinstance(item, dict) else None
                for item in array]

    def _pluck(self, context: Dict, array: Any, key: str) -> List:
        """Alias for map - pluck values by key."""
        return self._map(context, array, key)

    def _unique(self, context: Dict, array: Any) -> List:
        """Get unique items from array."""
        if not isinstance(array, (list, tuple)):
            return []

        seen = set()
        result = []
        for item in array:
            # Use JSON serialization for complex types
            key = json.dumps(item, sort_keys=True) if isinstance(
                item, (dict, list)) else item
            if key not in seen:
                seen.add(key)
                result.append(item)
        return result

    def _flatten(self, context: Dict, array: Any) -> List:
        """Flatten nested array."""
        if not isinstance(array, (list, tuple)):
            return []

        result = []
        for item in array:
            if isinstance(item, (list, tuple)):
                result.extend(self._flatten(context, item))
            else:
                result.append(item)
        return result

    def _sort(self, context: Dict, array: Any, key: Optional[str] = None, reverse: bool = False) -> List:
        """Sort array."""
        if not isinstance(array, (list, tuple)):
            return []

        try:
            if key:
                return sorted(array, key=lambda x: x.get(key) if isinstance(x, dict) else x, reverse=reverse)
            return sorted(array, reverse=reverse)
        except Exception:
            return list(array)

    # ==================== String Operations ====================

    def _uppercase(self, context: Dict, text: Any) -> str:
        """Convert to uppercase."""
        return str(text).upper()

    def _lowercase(self, context: Dict, text: Any) -> str:
        """Convert to lowercase."""
        return str(text).lower()

    def _capitalize(self, context: Dict, text: Any) -> str:
        """Capitalize first letter."""
        return str(text).capitalize()

    def _trim(self, context: Dict, text: Any) -> str:
        """Trim whitespace."""
        return str(text).strip()

    def _split(self, context: Dict, text: Any, separator: str = ',') -> List[str]:
        """Split string by separator."""
        return str(text).split(separator)

    def _replace(self, context: Dict, text: Any, old: str, new: str) -> str:
        """Replace text."""
        return str(text).replace(old, new)

    def _substring(self, context: Dict, text: Any, start: int, end: Optional[int] = None) -> str:
        """Get substring."""
        return str(text)[start:end]

    def _concat(self, context: Dict, *args) -> str:
        """Concatenate strings."""
        return ''.join(str(arg) for arg in args)

    # ==================== Conditional Operations ====================

    def _if(self, context: Dict, condition: Any, true_value: Any, false_value: Any = '') -> Any:
        """Conditional operation."""
        return true_value if condition else false_value

    def _default(self, context: Dict, value: Any, default: Any) -> Any:
        """Return default if value is None or empty."""
        if value is None or value == '':
            return default
        return value

    def _is_empty(self, context: Dict, value: Any) -> bool:
        """Check if value is empty."""
        if value is None:
            return True
        if isinstance(value, (str, list, dict)):
            return len(value) == 0
        return False

    def _is_null(self, context: Dict, value: Any) -> bool:
        """Check if value is null."""
        return value is None

    def _equals(self, context: Dict, value1: Any, value2: Any) -> bool:
        """Check if two values are equal."""
        return value1 == value2

    # ==================== Math Operations ====================

    def _sum(self, context: Dict, *args) -> float:
        """Sum numbers."""
        try:
            return sum(float(arg) for arg in args if arg is not None)
        except (ValueError, TypeError):
            return 0

    def _avg(self, context: Dict, *args) -> float:
        """Average of numbers."""
        try:
            numbers = [float(arg) for arg in args if arg is not None]
            return sum(numbers) / len(numbers) if numbers else 0
        except (ValueError, TypeError):
            return 0

    def _min(self, context: Dict, *args) -> float:
        """Minimum value."""
        try:
            numbers = [float(arg) for arg in args if arg is not None]
            return min(numbers) if numbers else 0
        except (ValueError, TypeError):
            return 0

    def _max(self, context: Dict, *args) -> float:
        """Maximum value."""
        try:
            numbers = [float(arg) for arg in args if arg is not None]
            return max(numbers) if numbers else 0
        except (ValueError, TypeError):
            return 0

    def _round(self, context: Dict, number: Any, decimals: int = 0) -> float:
        """Round number."""
        try:
            return round(float(number), decimals)
        except (ValueError, TypeError):
            return 0

    def _floor(self, context: Dict, number: Any) -> int:
        """Floor number."""
        try:
            import math
            return math.floor(float(number))
        except (ValueError, TypeError):
            return 0

    def _ceil(self, context: Dict, number: Any) -> int:
        """Ceil number."""
        try:
            import math
            return math.ceil(float(number))
        except (ValueError, TypeError):
            return 0

    # ==================== Date Operations ====================

    def _format_date(self, context: Dict, date_str: Any, format: str = '%Y-%m-%d') -> str:
        """Format date string."""
        try:
            if isinstance(date_str, datetime):
                return date_str.strftime(format)
            dt = datetime.fromisoformat(str(date_str).replace('Z', '+00:00'))
            return dt.strftime(format)
        except Exception:
            return str(date_str)

    def _now(self, context: Dict, format: Optional[str] = None) -> str:
        """Get current timestamp."""
        now = datetime.now()
        if format:
            return now.strftime(format)
        return now.isoformat()

    def _date_diff(self, context: Dict, date1: Any, date2: Any, unit: str = 'days') -> int:
        """Calculate difference between two dates."""
        try:
            dt1 = datetime.fromisoformat(str(date1).replace('Z', '+00:00'))
            dt2 = datetime.fromisoformat(str(date2).replace('Z', '+00:00'))
            diff = dt1 - dt2

            if unit == 'days':
                return diff.days
            elif unit == 'hours':
                return int(diff.total_seconds() / 3600)
            elif unit == 'minutes':
                return int(diff.total_seconds() / 60)
            elif unit == 'seconds':
                return int(diff.total_seconds())
            return diff.days
        except Exception:
            return 0

    # ==================== Type Conversion ====================

    def _to_string(self, context: Dict, value: Any) -> str:
        """Convert to string."""
        return str(value)

    def _to_number(self, context: Dict, value: Any) -> float:
        """Convert to number."""
        try:
            return float(value)
        except (ValueError, TypeError):
            return 0

    def _to_boolean(self, context: Dict, value: Any) -> bool:
        """Convert to boolean."""
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            return value.lower() in ('true', '1', 'yes', 'on')
        return bool(value)


# Create singleton instance
template_engine = TemplateEngine()
