import { Action, Image } from "./action";
import { AiAssistantData } from "./ai-assistant";

type AdditionalParam = {
  title: string;
  title_h2: string;
  title_h3: string;
  description: string;
  banner_title: string;
  banner_description: string;
  designation: string;
  name: string;
  html_code: string;
  body: string;
  date: string;
}

type Employee = {
  image: Image;
  name: string;
  designation: string;
  $: AdditionalParam;
}

type BucketList = [
  BucketArray:{
    title_h3: string;
    description: string;
    url: string;
    call_to_action: Action;
    icon: Image;
    $: AdditionalParam;
  }
]

export type CardItem = {
  title_h3?: string;
  description?: string;
  call_to_action?: Action;
  $?: AdditionalParam;
};

type Article = {
  href: string;
  title: string;
  $: AdditionalParam;
}

type FeaturedBlog = [
  BlogArray: {
    title: string;
    featured_image: Image;
    body: string;
    url: string;
    $: AdditionalParam;
  }
]

type Widget = {
  title_h2: string;
  type?: string;
  $: AdditionalParam;
}

export type AdBanner = {
  banner_title: string;
  banner_description: string;
  background_image: Image;
  call_to_action: Action;
  text_color?: string;
  $: AdditionalParam;
};

export type IconCardItem = {
  title?: string;
  description?: string;
  icon?: Image;
  icon_image?: Image;
  call_to_action?: Action;
  action_cta?: Action;
  cta?: Action;
  $?: AdditionalParam;
};

export type IconCards = {
  title?: string;
  description?: string;
  icon_cards?: IconCardItem[];
  icon_card?: IconCardItem | IconCardItem[];
  $?: AdditionalParam;
};

export type Component = {
  description: any;
  superheroes: any;
  hero_banner: Banner;
  ad_banner?: AdBanner;
  icon_cards?: IconCards;
  icon_card?: IconCards;
  ai_assistant?: AiAssistantData;
  section?: SectionProps;
  section_with_buckets?: SectionWithBucket;
  from_blog?: FeaturedBlogData;
  section_with_cards?: Cards;
  section_with_html_code?: AdditionalParamProps;
  our_team?: TeamProps;
  widget?: Widget;
}

export type SectionWithBucket = {
    bucket_tabular: boolean
    title_h2: string;
    buckets: BucketList;
    description: string;
    $: AdditionalParam;
  }

export type Cards = {
    cards?: CardItem | CardItem[];
  }
  
export type Banner = {
    banner_title:string;
    banner_description: string;
    bg_color: string;
    call_to_action: Action;
    call_to_action_2?: Action;
    banner_image: Image;
    text_color: string;
    $: AdditionalParam;
  }
  
export type AdditionalParamProps = {
    html_code_alignment: string;
    title: string;
    $: AdditionalParam;
    description: string;
    html_code: string;
  }
  
export type SectionProps = {
    title_h2: String;
    description: string;
    call_to_action: Action;
    image: Image;
    image_alignment: string;
    $: AdditionalParam;
  } 
  
export type TeamProps = {
    title_h2: string;
    description: string;
    $: AdditionalParam;
    employees: [Employee];
  }
  
export type FeaturedBlogData = {
    title_h2: string;
    view_articles: Article;
    featured_blogs: FeaturedBlog;
    $: AdditionalParam;
}

export type RenderProps = {
  blogPost?: boolean;
  contentTypeUid: string;
  entryUid: string;
  locale: string;
  pageComponents:Component[];
}