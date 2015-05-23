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
<a alt="home" class="navbar-brand" href="../../../../../../index.html" title="aggregit"><span>aggre</span><span>git</span></a>
</div>
<div class="">
<form class="nav-search navbar-form navbar-left">
<div class="input-group">
<span class="input-group-addon"><i class="fa fa-search fa-2x"></i></span>
<input class="form-control" id="username" placeholder="Search for username" type="text"/>
</div>
</form>
<ul class="nav navbar-nav navbar-right">
<li><a alt="" href="https://github.com" id="nav-github" target="_blank" title=""><i class="fa fa-github fa-2x"></i></a></li>
<li><a alt="" href="#" id="nav-user" target="_blank" title=""><i class="fa fa-user fa-2x"></i></a></li>
<li><a alt="" href="#!/about" title=""><i class="fa fa-question-circle fa-2x"></i></a></li>
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
<p class="pull-left">aggregit</p>
<p class="pull-right">2015 &copy; <a alt="tmthydvnprt" href="#" title="tmthydvnprt">tmthydvnprt</a></p>
</div>
</div>
</footer>
<!--quilted templates patch-->
<template id="user-info-template">
<div class="media">
<div class="media-left">
<a alt="{login} avatar" href="{html_url}" target="_blank" title="{login} avatar"><img alt="{login} avatar" class="media-object" id="avatar" src="{avatar_url}" title="{login} avatar"/></a>
</div>
<div class="media-body">
<h1 class="media-heading"><span id="name">{name}</span><br/><small id="username">{login}</small></h1>
<ul class="list-inline">
<li><i class="fa fa-fw fa-envelope-o"></i> <a alt="email: {email}" href="mailto:{email}" id="email" title="email: {email}">{email}</a></li>
<li><i class="fa fa-fw fa-link"></i> <a alt="blog: {blog}" href="http://{blog}" id="blog" title="blog: {blog}">{blog}</a></li>
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
</template>
<template id="user-template">
<section class="bringIn">
<div class="jumbotron">
<div id="user-info"></div>
</div>
<div id="user-data"></div>
</section>
</template>
<template id="user-data-template">
</template>
<template id="about-template">
<section class="bringIn">
<div class="row">
<div class="col-sm-8 col-sm-offset-2">
<h1>About Aggregit</h1>
<hr/>
<h3>Multi-Repo Punch Card</h3>
<p class="lead">Ever wanted to see your punch card for all repos? your non-<code>master</code> contributions in the heat map? <em>all</em> your language stats? Well, those are the reasons for building this.</p>
<h4>Data, Data, Data!</h4>
<p class="lead">The page makes a bunch of unauthenticated calls to the GitHub API to get a whole mess of <code>json</code> that can be plotted or presented in a beautiful way.</p>
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
<div class="col-sm-8 col-sm-offset-2">
<h2 class="text-center">Search for a username</h2>
<div class="well well-sm">
<form class="home-search">
<div class="input-group">
<span class="input-group-addon"><i class="fa fa-search fa-2x"></i></span>
<input class="form-control" id="username" placeholder="Search for GitHub username" type="text"/>
</div>
</form>
</div>
<h2 class="text-center"><small>maybe yourself, a friend or future employee</small></h2>
</div>
</div>
</section>
</template>
<!--quilted scripts patch-->
<script id="scripts" rel="javascript" src="../../../../../../js/jquery-1.11.2.min.js" type="text/javascript"></script>
<script rel="javascript" src="../../../../../../js/aggregit.js" type="text/javascript"></script>
</body>
</html>