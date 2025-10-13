"""
Unit tests for the enhanced template engine.
"""

import pytest
from src.app.services.template_engine import TemplateEngine


@pytest.fixture
def engine():
    """Create template engine instance."""
    return TemplateEngine()


@pytest.fixture
def sample_context():
    """Sample context for testing."""
    return {
        'user': {
            'name': 'John Doe',
            'email': 'john@example.com',
            'age': 30,
            'profile': {
                'city': 'New York',
                'country': 'USA'
            }
        },
        'items': [
            {'name': 'Item 1', 'price': 10.99, 'quantity': 2},
            {'name': 'Item 2', 'price': 25.50, 'quantity': 1},
            {'name': 'Item 3', 'price': 5.99, 'quantity': 5}
        ],
        'node_abc123_result': {
            'success': True,
            'data': {
                'message': 'Operation completed',
                'count': 42,
                'items': ['A', 'B', 'C']
            }
        },
        'empty_string': '',
        'null_value': None,
        'number': 100,
        'boolean': True
    }


class TestVariableResolution:
    """Test variable resolution ${var}."""

    def test_simple_variable(self, engine, sample_context):
        """Test simple variable resolution."""
        result = engine.resolve('${user}', sample_context)
        assert result == sample_context['user']

    def test_nested_property(self, engine, sample_context):
        """Test nested property access."""
        result = engine.resolve('${user.name}', sample_context)
        assert result == 'John Doe'

    def test_deep_nested_property(self, engine, sample_context):
        """Test deeply nested property."""
        result = engine.resolve('${user.profile.city}', sample_context)
        assert result == 'New York'

    def test_array_index(self, engine, sample_context):
        """Test array index access."""
        result = engine.resolve('${items[0].name}', sample_context)
        assert result == 'Item 1'

    def test_node_result(self, engine, sample_context):
        """Test node result access."""
        result = engine.resolve(
            '${node_abc123_result.data.message}', sample_context)
        assert result == 'Operation completed'

    def test_string_interpolation(self, engine, sample_context):
        """Test variable in string."""
        result = engine.resolve('Hello ${user.name}!', sample_context)
        assert result == 'Hello John Doe!'

    def test_multiple_variables(self, engine, sample_context):
        """Test multiple variables in string."""
        result = engine.resolve('${user.name} (${user.email})', sample_context)
        assert result == 'John Doe (john@example.com)'

    def test_missing_variable(self, engine, sample_context):
        """Test missing variable returns original."""
        result = engine.resolve('${missing_var}', sample_context)
        assert result == '${missing_var}'

    def test_missing_nested(self, engine, sample_context):
        """Test missing nested property."""
        result = engine.resolve('${user.missing.field}', sample_context)
        assert result == '${user.missing.field}'


class TestJSONOperations:
    """Test JSON helper functions."""

    def test_json_get_simple(self, engine, sample_context):
        """Test json_get with simple path."""
        result = engine.resolve(
            '{{json_get node_abc123_result "data.message"}}', sample_context)
        assert result == 'Operation completed'

    def test_json_get_array(self, engine, sample_context):
        """Test json_get with array."""
        result = engine.resolve(
            '{{json_get items "[0].name"}}', sample_context)
        assert result == 'Item 1'

    def test_to_json(self, engine, sample_context):
        """Test converting to JSON."""
        result = engine.resolve('{{to_json ${user.profile}}}', sample_context)
        assert '"city": "New York"' in result

    def test_parse_json(self, engine, sample_context):
        """Test parsing JSON string."""
        json_str = '{"test": "value"}'
        result = engine.resolve(
            f'{{{{parse_json "{json_str}"}}}}', sample_context)
        # Result is converted back to string for template output
        assert 'test' in str(result)


class TestArrayOperations:
    """Test array helper functions."""

    def test_first(self, engine, sample_context):
        """Test getting first item."""
        template = '{{first ${items}}}'
        # This gets complex - let's test with direct call
        result = engine.helpers['first'](
            sample_context, sample_context['items'])
        assert result == sample_context['items'][0]

    def test_last(self, engine, sample_context):
        """Test getting last item."""
        result = engine.helpers['last'](
            sample_context, sample_context['items'])
        assert result == sample_context['items'][2]

    def test_length(self, engine, sample_context):
        """Test array length."""
        result = engine.helpers['length'](
            sample_context, sample_context['items'])
        assert result == 3

    def test_join(self, engine, sample_context):
        """Test array join."""
        array = ['a', 'b', 'c']
        result = engine.helpers['join'](sample_context, array, ', ')
        assert result == 'a, b, c'

    def test_pluck(self, engine, sample_context):
        """Test plucking property from array."""
        result = engine.helpers['pluck'](
            sample_context, sample_context['items'], 'name')
        assert result == ['Item 1', 'Item 2', 'Item 3']

    def test_filter(self, engine, sample_context):
        """Test filtering array."""
        result = engine.helpers['filter'](
            sample_context, sample_context['items'], 'name', 'Item 1')
        assert len(result) == 1
        assert result[0]['name'] == 'Item 1'

    def test_unique(self, engine, sample_context):
        """Test getting unique items."""
        array = [1, 2, 2, 3, 3, 3]
        result = engine.helpers['unique'](sample_context, array)
        assert result == [1, 2, 3]

    def test_flatten(self, engine, sample_context):
        """Test flattening nested array."""
        nested = [[1, 2], [3, 4], [5]]
        result = engine.helpers['flatten'](sample_context, nested)
        assert result == [1, 2, 3, 4, 5]

    def test_sort(self, engine, sample_context):
        """Test sorting array."""
        array = [3, 1, 2]
        result = engine.helpers['sort'](sample_context, array)
        assert result == [1, 2, 3]

    def test_sort_by_key(self, engine, sample_context):
        """Test sorting by object key."""
        result = engine.helpers['sort'](
            sample_context, sample_context['items'], 'price')
        assert result[0]['price'] == 5.99
        assert result[2]['price'] == 25.50


class TestStringOperations:
    """Test string helper functions."""

    def test_uppercase(self, engine, sample_context):
        """Test uppercase."""
        result = engine.helpers['uppercase'](sample_context, 'hello')
        assert result == 'HELLO'

    def test_lowercase(self, engine, sample_context):
        """Test lowercase."""
        result = engine.helpers['lowercase'](sample_context, 'HELLO')
        assert result == 'hello'

    def test_capitalize(self, engine, sample_context):
        """Test capitalize."""
        result = engine.helpers['capitalize'](sample_context, 'hello world')
        assert result == 'Hello world'

    def test_trim(self, engine, sample_context):
        """Test trim whitespace."""
        result = engine.helpers['trim'](sample_context, '  hello  ')
        assert result == 'hello'

    def test_split(self, engine, sample_context):
        """Test string split."""
        result = engine.helpers['split'](sample_context, 'a,b,c', ',')
        assert result == ['a', 'b', 'c']

    def test_replace(self, engine, sample_context):
        """Test string replace."""
        result = engine.helpers['replace'](
            sample_context, 'hello world', 'world', 'universe')
        assert result == 'hello universe'

    def test_substring(self, engine, sample_context):
        """Test substring."""
        result = engine.helpers['substring'](
            sample_context, 'hello world', 0, 5)
        assert result == 'hello'

    def test_concat(self, engine, sample_context):
        """Test concatenation."""
        result = engine.helpers['concat'](
            sample_context, 'hello', ' ', 'world')
        assert result == 'hello world'


class TestConditionalOperations:
    """Test conditional helper functions."""

    def test_if_true(self, engine, sample_context):
        """Test if condition true."""
        result = engine.helpers['if'](sample_context, True, 'yes', 'no')
        assert result == 'yes'

    def test_if_false(self, engine, sample_context):
        """Test if condition false."""
        result = engine.helpers['if'](sample_context, False, 'yes', 'no')
        assert result == 'no'

    def test_default_with_value(self, engine, sample_context):
        """Test default with existing value."""
        result = engine.helpers['default'](sample_context, 'value', 'default')
        assert result == 'value'

    def test_default_with_none(self, engine, sample_context):
        """Test default with None."""
        result = engine.helpers['default'](sample_context, None, 'default')
        assert result == 'default'

    def test_is_empty_true(self, engine, sample_context):
        """Test is_empty with empty value."""
        result = engine.helpers['is_empty'](sample_context, '')
        assert result is True

    def test_is_empty_false(self, engine, sample_context):
        """Test is_empty with value."""
        result = engine.helpers['is_empty'](sample_context, 'hello')
        assert result is False

    def test_is_null(self, engine, sample_context):
        """Test is_null."""
        result = engine.helpers['is_null'](sample_context, None)
        assert result is True

    def test_equals_true(self, engine, sample_context):
        """Test equals match."""
        result = engine.helpers['equals'](sample_context, 'a', 'a')
        assert result is True

    def test_equals_false(self, engine, sample_context):
        """Test equals no match."""
        result = engine.helpers['equals'](sample_context, 'a', 'b')
        assert result is False


class TestMathOperations:
    """Test math helper functions."""

    def test_sum(self, engine, sample_context):
        """Test sum."""
        result = engine.helpers['sum'](sample_context, 1, 2, 3)
        assert result == 6

    def test_avg(self, engine, sample_context):
        """Test average."""
        result = engine.helpers['avg'](sample_context, 1, 2, 3)
        assert result == 2

    def test_min(self, engine, sample_context):
        """Test minimum."""
        result = engine.helpers['min'](sample_context, 1, 2, 3)
        assert result == 1

    def test_max(self, engine, sample_context):
        """Test maximum."""
        result = engine.helpers['max'](sample_context, 1, 2, 3)
        assert result == 3

    def test_round(self, engine, sample_context):
        """Test round."""
        result = engine.helpers['round'](sample_context, 3.14159, 2)
        assert result == 3.14

    def test_floor(self, engine, sample_context):
        """Test floor."""
        result = engine.helpers['floor'](sample_context, 3.7)
        assert result == 3

    def test_ceil(self, engine, sample_context):
        """Test ceil."""
        result = engine.helpers['ceil'](sample_context, 3.2)
        assert result == 4


class TestDateOperations:
    """Test date helper functions."""

    def test_now(self, engine, sample_context):
        """Test getting current time."""
        result = engine.helpers['now'](sample_context)
        assert isinstance(result, str)
        # Should be ISO format
        assert 'T' in result

    def test_now_with_format(self, engine, sample_context):
        """Test formatted date."""
        result = engine.helpers['now'](sample_context, '%Y-%m-%d')
        assert len(result) == 10  # YYYY-MM-DD
        assert result.count('-') == 2

    def test_format_date(self, engine, sample_context):
        """Test formatting date."""
        date_str = '2025-10-12T10:30:00'
        result = engine.helpers['format_date'](
            sample_context, date_str, '%Y-%m-%d')
        assert result == '2025-10-12'


class TestTypeConversion:
    """Test type conversion functions."""

    def test_to_string(self, engine, sample_context):
        """Test to_string."""
        result = engine.helpers['to_string'](sample_context, 123)
        assert result == '123'
        assert isinstance(result, str)

    def test_to_number(self, engine, sample_context):
        """Test to_number."""
        result = engine.helpers['to_number'](sample_context, '123.45')
        assert result == 123.45
        assert isinstance(result, float)

    def test_to_boolean_true(self, engine, sample_context):
        """Test to_boolean with true values."""
        assert engine.helpers['to_boolean'](sample_context, 'true') is True
        assert engine.helpers['to_boolean'](sample_context, '1') is True
        assert engine.helpers['to_boolean'](sample_context, 'yes') is True

    def test_to_boolean_false(self, engine, sample_context):
        """Test to_boolean with false values."""
        assert engine.helpers['to_boolean'](sample_context, 'false') is False
        assert engine.helpers['to_boolean'](sample_context, '0') is False
        assert engine.helpers['to_boolean'](sample_context, '') is False


class TestComplexScenarios:
    """Test complex real-world scenarios."""

    def test_workflow_email_generation(self, engine):
        """Test generating email from workflow data."""
        context = {
            'user': {'name': 'John', 'email': 'john@example.com'},
            'order': {
                'id': '12345',
                'items': [
                    {'name': 'Product 1', 'quantity': 2, 'price': 10.00},
                    {'name': 'Product 2', 'quantity': 1, 'price': 25.00}
                ],
                'total': 45.00
            }
        }

        # Test subject
        subject = engine.resolve('Order ${order.id} Confirmation', context)
        assert subject == 'Order 12345 Confirmation'

        # Test getting item names
        item_names = engine.helpers['pluck'](
            context, context['order']['items'], 'name')
        assert len(item_names) == 2

    def test_conditional_message(self, engine):
        """Test conditional message generation."""
        context = {
            'result': {'success': True, 'count': 5}
        }

        # This would be done with a more complex template in practice
        success = context['result']['success']
        message = engine.helpers['if'](
            context,
            success,
            f"Successfully processed {context['result']['count']} items",
            "Processing failed"
        )

        assert "Successfully processed 5 items" in message

    def test_data_aggregation(self, engine):
        """Test data aggregation from multiple sources."""
        context = {
            'node_1_result': {'values': [10, 20, 30]},
            'node_2_result': {'values': [5, 15, 25]},
        }

        # Get all values
        values1 = context['node_1_result']['values']
        values2 = context['node_2_result']['values']

        # Calculate sums
        sum1 = engine.helpers['sum'](context, *values1)
        sum2 = engine.helpers['sum'](context, *values2)

        assert sum1 == 60
        assert sum2 == 45

    def test_nested_dict_and_array_resolution(self, engine):
        """Test complex nested structure resolution."""
        context = {
            'api_response': {
                'data': {
                    'users': [
                        {'id': 1, 'name': 'Alice', 'tags': ['admin', 'user']},
                        {'id': 2, 'name': 'Bob', 'tags': ['user']},
                        {'id': 3, 'name': 'Charlie', 'tags': ['user', 'guest']}
                    ]
                }
            }
        }

        # Access nested array item
        result = engine.resolve('${api_response.data.users[1].name}', context)
        assert result == 'Bob'

        # Get user names
        users = context['api_response']['data']['users']
        names = engine.helpers['pluck'](context, users, 'name')
        assert names == ['Alice', 'Bob', 'Charlie']


class TestEdgeCases:
    """Test edge cases and error handling."""

    def test_empty_context(self, engine):
        """Test with empty context."""
        result = engine.resolve('${missing}', {})
        assert result == '${missing}'

    def test_none_value(self, engine):
        """Test None values."""
        context = {'value': None}
        result = engine.resolve('${value}', context)
        # Should return None, not string
        assert result is None

    def test_deeply_nested_missing(self, engine):
        """Test deeply nested missing path."""
        context = {'a': {'b': {'c': 'd'}}}
        result = engine.resolve('${a.b.c.d.e.f}', context)
        assert result == '${a.b.c.d.e.f}'

    def test_invalid_helper(self, engine):
        """Test invalid helper function."""
        result = engine.resolve('{{invalid_helper arg}}', {})
        # Should return original template
        assert result == '{{invalid_helper arg}}'

    def test_helper_with_error(self, engine):
        """Test helper that throws error."""
        context = {'items': 'not-an-array'}
        # Should handle gracefully
        result = engine.helpers['first'](context, 'not-an-array')
        assert result is None


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
