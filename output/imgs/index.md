<!DOCTYPE html>
<html lang="en">
<!--quilted head patch-->
<head>
<meta charset="utf-8"/>
<meta content="ie=edge" http-equiv="X-UA-Compatible"/>
<meta content="width=device-width, initial-scale=1" name="viewport"/>
<!---->
<title>imgs directory index</title>
<meta content="tmthydvnprt" name="author"/>
<meta content="blank index page of imgs directory" name="description"/>
<meta content="i,n,d,e,x" name="keywords"/>
<link href="../../../../../../imgs/favicon.ico" rel="favicon"/>
<link href="../../../../../../img/icon_60x60.png" rel="apple-touch-icon"/>
<link href="../../../../../../img/icon_76x76.png" rel="apple-touch-icon" sizes="76x76"/>
<link href="../../../../../../img/icon_120x120.png" rel="apple-touch-icon" sizes="120x120"/>
<link href="../../../../../../img/icon_152x152.png" rel="apple-touch-icon" sizes="152x152"/>
<link href="../../../../../../css/bootstrap_font-awesome.min_aggregit.css" rel="stylesheet" type="text/css"/></head>
<body>
<!--quilted nav patch-->
<nav class="navbar navbar-inverse navbar-default navbar-fixed-top" id="nav">
<div class="container">
<div class="navbar-header">
<a alt="home" class="navbar-brand" href="#!/home" title="home">
<i class="fa fa-home"></i>
<span>aggre</span><span>git</span>
</a>
<span class="label label-warning" id="beta">beta</span>
</div>
<div class="">
<form class="nav-search navbar-form navbar-left">
<div alt="Search for username" class="input-group force-hover" title="Search for username">
<span class="input-group-addon"><i class="fa fa-search fa-2x"></i></span>
<input class="form-control" id="username" placeholder="Search for username" type="text"/>
</div>
</form>
<ul class="nav navbar-nav navbar-right">
<li><a alt="about this!" href="#!/about" title="about this!"><i class="fa fa-info-circle fa-2x"></i></a></li>
<li><a alt="need help?" href="#!/help" title="need help?"><i class="fa fa-question-circle fa-2x"></i></a></li>
<li><a alt="go to GitHub" href="https://github.com" id="nav-user" target="_blank" title="go to GitHub"><i class="fa fa-github fa-2x"></i></a></li>
</ul>
</div>
</div>
</nav>
<!--quilted page patch-->
<div class="container text-center" id="page">
<h2><br/></h2>
<h2>Index page of the <code>imgs/</code> directory.</h2>
<h3>This page was intentionally left blank.</h3>
<h3><small>Nothing to see here, move along.</small></h3>
</div>
<!--quilted footer patch-->
<footer id="footer">
<div class="container">
<hr/>
<div class="clearfix">
<p class="pull-left">
<a alt="aggregit" href="index.html" title="aggregit">aggregit</a>
                | <a alt="contact" href="#!/contact" title="contact">contact</a>
                &bull; <a alt="about" href="#!/about" title="about">about</a>
                &bull; <a alt="help" href="#!/help" title="help">help</a>
</p>
<p class="pull-right">2015 &copy; <a alt="tmthydvnprt" href="https://github.com/tmthydvnprt" title="tmthydvnprt">tmthydvnprt</a></p>
</div>
</div>
</footer>
<!--quilted templates patch-->
<template id="user-info-template">
<div class="row">
<div class="col-sm-6">
<div class="media">
<div class="media-left">
<a alt="{login} avatar" href="{html_url}" target="_blank" title="{login} avatar"><img alt="{login} avatar" class="media-object" id="avatar" src="{avatar_url}" title="{login} avatar"/></a>
</div>
<div class="media-body">
<h1 class="media-heading"><span id="name">{name}</span><br/><small id="username">{login}</small></h1>
<ul class="list-inline">
<li><i class="fa fa-fw fa-envelope-o"></i> <a alt="email: {email}" href="mailto:{email}" id="email" title="email: {email}">{email}</a></li>
<li><i class="fa fa-fw fa-link"></i> <a alt="blog: {blog}" href="http://{blog}" id="blog" title="blog: {blog}">{blog}</a></li>
</ul>
<ul class="list-inline">
<li><i class="fa fa-fw fa-building-o"></i> <span alt="company: {company}" id="company" title="company: {company}">{company}</span></li>
<li><i class="fa fa-fw fa-location-arrow"></i> <span alt="location: {location}" id="location" title="location: {location}">{location}</span></li>
</ul>
<ul class="list-inline">
<li><i class="fa fa-fw fa-clock-o"></i> <span alt="created: {created_at}" id="created">{created_at}</span></li>
<li><i class="fa fa-fw fa-refresh"></i> <span alt="updated: {updated_at}" id="updated">{updated_at}</span></li>
</ul>
<ul class="list-inline">
<li><i class="fa fa-fw fa-book"></i> <span alt="repos: {public_repos}" id="repos">{public_repos}</span></li>
<li><i class="fa fa-fw fa-file-text-o"></i> <span alt="gists: {public_gists}" id="gists">{public_gists}</span></li>
<li><i class="fa fa-fw fa-users"></i> <span alt="followers: {followers}" id="followers">{followers}</span></li>
<li><i class="fa fa-fw fa-user-plus"></i> <span alt="following: {following}" id="following">{following}</span></li>
</ul>
</div>
</div>
</div>
<div class="col-sm-6"></div>
</div>
</template>
<template id="user-data-template">
<div class="row">
<div class="col-sm-10 col-sm-offset-1">
<h2>When does {login} code?</h2>
<hr/>
<div class="well well-sm">
<div class="row">
<div class="col-xs-2">
<p class="text-right"><strong>Repos:</strong></p>
</div>
<div class="col-xs-10">
<ul class="checklist list-inline" id="punchcard-checklist"></ul>
</div>
</div>
</div>
<div id="punchcard"></div>
<h2>How long has {login} been coding?</h2>
<hr/>
<div class="well well-sm">
<div class="row">
<div class="col-xs-2">
<p class="text-right"><strong>Repos:</strong></p>
</div>
<div class="col-xs-10">
<ul class="checklist list-inline" id="participation-checklist"></ul>
</div>
</div>
<div class="row">
<div class="col-xs-2">
<p class="text-right"><strong>Who:</strong></p>
</div>
<div class="col-xs-4">
<ul class="checklist list-inline" id="ownerall-checklist">
<li><input checked="" name="owner" type="checkbox"/>owner</li>
<li><input name="all" type="checkbox"/>all</li>
</ul>
</div>
<div class="col-xs-2">
<p class="text-right"><strong>Zoom:</strong></p>
</div>
<div class="col-xs-4">
<ul class="checklist list-inline" id="zoom-checklist">
<li><input checked="" name="owner" type="checkbox"/>ignore time before first commit</li>
</ul>
</div>
</div>
</div>
<div id="participation"></div>
<div id="heatmap"></div>
<h2>What languages does {login} speak?</h2>
<hr/>
<div class="well well-sm">
<div class="row">
<div class="col-xs-3">
<p><strong>Repos:</strong></p>
<ul class="checklist" id="languages-checklist"></ul>
</div>
<div class="col-xs-9">
<div id="languages"></div>
</div>
</div>
</div>
</div>
</div>
</template>
<template id="help-template">
<section class="bringIn">
<i class="fa fa-arrow-up" id="help-arrow"></i>
<div class="jumbotron">
<div class="row">
<div class="col-sm-8 col-sm-offset-2">
<h1>Help? <small>&mdash; it's easy!</small></h1>
<hr/>
<h3>
<ol>
<li>type in a GitHub username</li>
<li>press <kbd>enter</kbd></li>
<li>enjoy the data!</li>
</ol>
</h3>
<hr/>
<h2><small>Or check out this <a alt="example of user data" href="#!/user=aggregit_example" title="example of user data">example of user data</a>.</small></h2>
</div>
</div>
</div>
</section>
</template>
<template id="user-template">
<section class="bringIn">
<div class="jumbotron">
<div id="user-info"></div>
</div>
<div id="user-data"></div>
</section>
</template>
<template id="repo-info-template">
</template>
<template id="contact-template">
<section class="bringIn">
<div class="jumbotron">
<div class="row">
<div class="col-sm-8 col-sm-offset-2">
<h1>Contact</h1>
<hr/>
<h1><a alt="tmthydvnprt" href="https://github.com/tmthydvnprt" title="tmthydvnprt">tmthydvnprt</a></h1>
<hr/>
</div>
</div>
</div>
</section>
</template>
<template id="unknown-template">
<section class="bringIn">
<div class="jumbotron">
<div class="row">
<div class="col-xs-12 text-center">
<h1>Hmm..? <small>That is an unknown location.</small></h1>
</div>
</div>
<div class="row">
<div class="col-xs-12 text-center">
<p class="lead">
                        Please return <a alt="home" href="../../../../../../index.html" title="home">home</a>.
                    </p>
</div>
</div>
</div>
</section>
</template>
<template id="about-template">
<section class="bringIn">
<div class="jumbotron">
<div class="row">
<div class="col-sm-8 col-sm-offset-2">
<h1>About Aggregit</h1>
<hr/>
<h3>Multi-Repo Punch Card Anyone?</h3>
<p class="lead">Ever wanted to see your punch card for <em>all</em> your repos? your non-<code>master</code> contributions in the heat map? <em>all</em> your language stats? Well, those are the reasons for building this.</p>
<h4>Data, Data, Data!</h4>
<p class="lead">The page makes a bunch of unauthenticated calls to the <a alt="GitHub API" href="https://developer.github.com/v3/" target="_blank" title="GitHub API">GitHub API</a> to get a whole mess of <code>json</code> that can be plotted or presented in a beautiful way.</p>
</div>
</div>
</div>
</section>
</template>
<template id="home-template">
<section class="bringIn">
<div class="jumbotron text-center">
<h1><span class="agg">aggre</span><span class="git">git</span></h1>
<p class="lead">See <em>all</em> your data accross <em>all</em> your <a alt="GitHub" href="https://github.com" target="_blank" title="GitHub">GitHub</a> repositories.</p>
</div>
<div class="row">
<div class="col-sm-8 col-sm-offset-2 col-md-6 col-md-offset-3">
<h3 class="text-center">Search for a username</h3>
<div class="well well-sm">
<form class="home-search">
<div class="input-group">
<span class="input-group-addon"><i class="fa fa-search fa-2x"></i></span>
<input class="form-control" id="username" placeholder="Search for GitHub username" type="text"/>
</div>
</form>
</div>
<h3 class="text-center"><small>maybe yourself, a friend or future employee</small></h3>
</div>
</div>
</section>
</template>
<template id="error-template">
<div class="col-xs-6 col-xs-offset-3">
<div class="alert alert-danger" id="rate-limit" role="alert">
<h1 class="text-center">Error <i class="fa fa-frown-o"></i></h1>
<p class="lead text-center">
                We've been <strong><a alt="rate-limited" href="https://developer.github.com/v3/#rate-limiting" target="_blank" title="rate-limited">rate-limited</a></strong> by GitHub's API!<br/>
<small>Calls from this <a alt="IP address" href="https://www.google.com/#q=what+is+my+ip" target="_blank" title="IP address"><abbr title="Internet Protocol">IP</abbr> address</a> will fail for one hour.</small>
</p>
</div>
</div>
</template>
<!--quilted scripts patch-->
<script id="scripts" rel="javascript" src="../../../../../../js/jquery-1.11.2.min.js" type="text/javascript"></script>
<script rel="javascript" src="../../../../../../js/d3.min.js" type="text/javascript"></script>
<script rel="javascript" src="../../../../../../js/cookieJar.js" type="text/javascript"></script>
<script rel="javascript" src="../../../../../../js/aggregit.js" type="text/javascript"></script>
</body>
</html>