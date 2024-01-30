module.exports = function slugify(str)
{
    str = str.toLowerCase();
    str = str.replace(/[^a-z0-9]+/g, '-');
    str = str.replace(/^-+|-+$/g, '');

    // Also replace first number to prevent invalid classes
    str = str.replace(/^[^\d]*(\d+)/, 'n');
    return str;
}
