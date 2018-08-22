+++
title = "blog"

description = "This is blog"

# Whether to sort by "date", "order", "weight" or "none". More on that below
sort_by = "date"

# Used by the parent section to order its subsections.
# Higher values means it will be at the end.
weight = 0

# Template to use to render this section page
template = "index.html"

# How many pages to be displayed per paginated page. 
# No pagination will happen if this isn't set or if the value is 0
paginate_by = 5

# If set, will be the path used by paginated page and the page number will be appended after it. 
# For example the default would be page/1
paginate_path = "page"

# Whether to insert a link for each header like the ones you can see in this site if you hover one
# The default template can be overridden by creating a `anchor-link.html` in the `templates` directory
# Options are "left", "right" and "none"
# insert_anchor_links = "none"

# Whether to render that section homepage or not. 
# Useful when the section is only there to organize things but is not meant
# to be used directly
# render = true

# Whether to redirect when landing on that section. Defaults to `None`.
# Useful for the same reason as `render` but when you don't want a 404 when
# landing on the root section page
# redirect_to = ""

# Your own data
[extra]
+++